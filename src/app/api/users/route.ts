import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from "@/connection";
import { z } from "zod";
import { User, UserRole } from "@/entities/User";
import bcrypt from "bcrypt";
import { cookies } from 'next/headers';
import { verifyToken } from '@/jwt';

// Skema Validasi (Menggunakan sintaks object { message } yang baru agar tidak deprecated)
const userSchema = z.object({
    name: z.string().min(1, { message: "Nama wajib diisi" }).max(100),
    email: z.string().email({ message: "Format email tidak valid" }),
    role: z.enum(["admin", "user"]).default("user"),
    password: z.string().min(6, { message: "Password minimal 6 karakter" }).optional(),
});

// Helper function untuk memvalidasi auth token dan mengembalikan actor
async function requireAdminAuth() {
    const cookiesJar = await cookies();
    const authToken = cookiesJar.get("auth_token")?.value;

    if (!authToken) return { error: "Unauthorized", status: 401 };

    const encoded = verifyToken<{ uid: string }>(authToken);
    if (!encoded || !encoded.uid) return { error: "Unauthorized", status: 401 };

    const db = await getConnection();
    const repository = db.getRepository(User);
    const actor = await repository.findOne({ where: { id: encoded.uid } });

    if (!actor) return { error: "Unauthorized", status: 401 };
    if (actor.role !== UserRole.ADMIN) return { error: "Forbidden", status: 403 };

    return { actor, repository, db };
}

export async function GET(request: NextRequest) {
    try {
        // Auth check: Hanya admin yang bisa melihat daftar user
        const auth = await requireAdminAuth();
        if (auth.error) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const search = searchParams.get("search") || "";
        const offset = (page - 1) * limit;

        // Query builder untuk fitur pencarian (Search)
        const queryBuilder = auth.repository!.createQueryBuilder("user")
            .skip(offset)
            .take(limit)
            .orderBy("user.name", "ASC");

        if (search) {
            queryBuilder.where("user.name ILIKE :search OR user.email ILIKE :search", { search: `%${search}%` });
        }

        const [users, totalUsers] = await queryBuilder.getManyAndCount();

        // Jangan kirim password ke frontend
        const sanitizedUsers = users.map((user: any) => {
            const { password, ...safeUser } = user;
            return safeUser;
        });

        return NextResponse.json({
            success: true,
            data: sanitizedUsers,
            metadata: {
                total: totalUsers,
                page: page,
                limit: limit,
                totalPages: Math.ceil(totalUsers / limit)
            }
        });
    } catch (error) {
        console.error("GET User Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Auth check
        const auth = await requireAdminAuth();
        if (auth.error) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const json = await request.json();

        // Untuk POST, password wajib
        const createSchema = userSchema.extend({
            password: z.string().min(6, { message: "Password minimal 6 karakter" })
        });

        const parseResult = createSchema.safeParse(json);

        if (!parseResult.success) {
            return NextResponse.json({
                success: false,
                errors: parseResult.error.flatten()
            }, { status: 400 });
        };

        const { data } = parseResult;
        const repository = auth.repository!;

        const existingUser = await repository.findOne({ where: { email: data.email } });
        if (existingUser) {
            return NextResponse.json({ success: false, error: "Email sudah terdaftar" }, { status: 409 });
        }

        const newUser = repository.create({
            name: data.name,
            email: data.email,
            role: data.role === "admin" ? UserRole.ADMIN : UserRole.USER,
            password: await bcrypt.hash(data.password, 10)
        });
        await repository.save(newUser);

        // Hapus password dari response
        const { password, ...safeUser } = newUser;

        return NextResponse.json({ success: true, data: safeUser }, { status: 201 });

    } catch (error) {
        console.error("POST User Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        // Auth check
        const auth = await requireAdminAuth();
        if (auth.error) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const json = await request.json();
        const updateSchema = userSchema.partial().extend({
            id: z.string().uuid({ message: "ID tidak valid" })
        });

        const parseResult = updateSchema.safeParse(json);

        if (!parseResult.success) {
            return NextResponse.json({
                success: false,
                errors: parseResult.error.flatten()
            }, { status: 400 });
        }

        const { data } = parseResult;
        const repository = auth.repository!;

        const user = await repository.findOne({ where: { id: data.id } });
        if (!user) {
            return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });
        }

        const patch = {} as Partial<User>;

        // Cek jika ganti email, apakah email sudah dipakai user lain
        if (data.email && data.email !== user.email) {
            const emailExist = await repository.findOne({ where: { email: data.email } });
            if (emailExist) {
                return NextResponse.json({ success: false, error: "Email sudah digunakan" }, { status: 409 });
            }
            patch.email = data.email;
        }

        if (data.name) patch.name = data.name;
        if (data.role) patch.role = data.role === "admin" ? UserRole.ADMIN : UserRole.USER;

        // Update password jika diisi
        if (data.password) {
            patch.password = await bcrypt.hash(data.password, 10);
        }

        await repository.update(user.id, patch);

        Object.assign(user, patch);
        const { password, ...safeUser } = user;

        return NextResponse.json({ success: true, data: safeUser }, { status: 200 });

    } catch (error) {
        console.error("PUT User Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // 1. Zod Validation First
        const json = await request.json();
        const parseResult = z.object({
            id: z.string().uuid({ message: "ID tidak valid" })
        }).safeParse(json);

        if (!parseResult.success) {
            return NextResponse.json({
                success: false,
                errors: parseResult.error.flatten()
            }, { status: 400 });
        }

        // 2. Auth Check
        const auth = await requireAdminAuth();
        if (auth.error) {
            return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
        }

        const actor = auth.actor!;
        const repository = auth.repository!;

        // 3. Business Logic Check: Admin cannot delete themselves
        if (actor.id === parseResult.data.id) {
            return NextResponse.json({
                success: false,
                error: "Admin tidak dapat menghapus dirinya sendiri"
            }, { status: 400 });
        }

        const user = await repository.findOne({ where: { id: parseResult.data.id } });
        if (!user) {
            return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });
        }
        if (user.role === UserRole.ADMIN) {
            const adminCount = await repository.count({ where: { role: UserRole.ADMIN } });
            if (adminCount <= 1) {
                return NextResponse.json({
                    success: false,
                    error: "Tidak dapat menghapus admin satu-satunya"
                }, { status: 400 });
            }
        }

        await repository.softDelete(parseResult.data.id);

        return NextResponse.json({ success: true, data: null }, { status: 200 });
    } catch (error) {
        console.error("DELETE User Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}