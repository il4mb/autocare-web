import { getConnection } from "@/connection";
import { User } from "@/entities/User";
import { verifyToken } from "@/jwt";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";

// Skema validasi untuk update profil
const profileSchema = z.object({
    name: z.string().min(1, { message: "Nama wajib diisi" }).max(100),
    email: z.email({ message: "Format email tidak valid" }),
    password: z.string().min(6, { message: "Password minimal 6 karakter" }).optional().or(z.literal("")),
}).partial(); // Semua field bersifat opsional, tapi jika diisi harus valid

export const GET = async (request: NextRequest) => {
    try {
        const cookiesJar = await cookies();
        const authToken = cookiesJar.get("auth_token")?.value;

        if (!authToken) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const encoded = verifyToken<{ uid: string }>(authToken);
        if (!encoded || !encoded.uid) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const db = await getConnection();
        const repository = db.getRepository(User);
        const actor = await repository.findOne({ where: { id: encoded.uid } });

        if (!actor) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({
            success: true,
            data: {
                id: actor.id,
                name: actor.name,
                email: actor.email,
                role: actor.role,
            }
        }, {
            status: 200,
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            }
        });
    } catch (error) {
        console.error("GET /auth/me Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
};

export const PUT = async (request: NextRequest) => {
    try {
        const cookiesJar = await cookies();
        const authToken = cookiesJar.get("auth_token")?.value;

        if (!authToken) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const encoded = verifyToken<{ uid: string }>(authToken);
        if (!encoded || !encoded.uid) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const json = await request.json();
        const parseResult = profileSchema.safeParse(json);

        if (!parseResult.success) {
            return NextResponse.json({
                success: false,
                errors: parseResult.error.flatten()
            }, { status: 400 });
        }

        const { data } = parseResult;
        const db = await getConnection();
        const repository = db.getRepository(User);

        const actor = await repository.findOne({ where: { id: encoded.uid } });
        if (!actor) return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });

        const patch = {} as Partial<User>;

        // Cek jika email diganti, pastikan belum dipakai orang lain
        if (data.email && data.email !== actor.email) {
            const emailExist = await repository.findOne({ where: { email: data.email } });
            if (emailExist) {
                return NextResponse.json({ success: false, error: "Email sudah terdaftar" }, { status: 409 });
            }
            patch.email = data.email;
        }

        // patch.name = data.name;
        if (data.name && data.name !== actor.name) {
            patch.name = data.name;
        }

        // Update password hanya jika diisi
        if (data.password && data.password.trim() !== "") {
            patch.password = await bcrypt.hash(data.password, 10);
        }

        await repository.update(actor.id, patch);
        Object.assign(actor, patch);

        const { password, ...safeUser } = actor;

        return NextResponse.json({ success: true, data: safeUser }, { status: 200 });

    } catch (error) {
        console.error("PUT /auth/me Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
};