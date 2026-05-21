import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from "@/connection";
import { z } from "zod";
import { Brand } from "@/entities/Brand";
import { DiagnosticCode } from '@/entities/DiagnosticCode';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const offset = (page - 1) * limit;

        const db = await getConnection();
        const brandRepository = db.getRepository(Brand);

        const qb = brandRepository.createQueryBuilder("brand")
            .skip(offset)
            .take(limit)
            .orderBy("brand.name", "ASC");

        if (searchParams.get("search")) {
            const search = `%${searchParams.get("search")}%`;
            qb.where("brand.name ILIKE :search", { search });
            // Catatan: Gunakan ILIKE untuk PostgreSQL, atau LIKE untuk MySQL
        }

        // 1. Dapatkan data Brand yang sudah dipaginasi beserta totalnya
        const [brands, totalBrands] = await qb.getManyAndCount();

        // 2. Jika ada brand, hitung jumlah diagnostic codes untuk brand-brand tersebut
        if (brands.length > 0) {
            const brandIds = brands.map(b => b.id);

            const counts = await db.getRepository(DiagnosticCode)
                .createQueryBuilder("dc")
                .innerJoin("dc.brand", "brand") // Menggunakan relasi brand
                .select("brand.id", "brandId")
                .addSelect("COUNT(dc.id)", "count")
                .where("brand.id IN (:...brandIds)", { brandIds })
                .groupBy("brand.id")
                .getRawMany();

            // 3. Gabungkan hasil perhitungan ke dalam array brands
            brands.forEach(brand => {
                const match = counts.find(c => c.brandId === brand.id);
                // Cast ke 'any' untuk menyisipkan field baru tanpa diomeli TypeScript
                (brand as any).diagnosticsCount = match ? parseInt(match.count, 10) : 0;
            });
        }

        return NextResponse.json({
            success: true,
            data: brands,
            metadata: {
                total: totalBrands,
                page: page,
                limit: limit,
                totalPages: Math.ceil(totalBrands / limit)
            }
        });
    } catch (error) {
        console.error("GET Brand Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const json = await request.json();
        const parseResult = z.object({ name: z.string().min(1).max(100) }).safeParse(json);

        if (!parseResult.success) {
            return NextResponse.json({
                success: false,
                error: "Invalid request body",
                details: z.flattenError(parseResult.error) // Tells frontend exactly what is wrong
            }, { status: 400 });
        }

        const { data } = parseResult;
        const db = await getConnection();
        const repository = db.getRepository(Brand);

        const existingBrand = await repository.findOne({ where: { name: data.name } });
        if (existingBrand) {
            return NextResponse.json({
                success: false,
                error: "Brand with the same name already exists"
            }, { status: 409 });
        }

        const newBrand = repository.create({
            name: data.name,
        });
        await repository.save(newBrand);

        return NextResponse.json({
            success: true,
            data: newBrand,
        }, { status: 201 });

    } catch (error) {
        console.error("POST Brand Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const json = await request.json();
        const parseResult = z.object({
            id: z.string().uuid(),
            name: z.string().min(1).max(100),
        }).safeParse(json);

        if (!parseResult.success) {
            return NextResponse.json({
                success: false,
                error: "Invalid request body",
                details: z.flattenError(parseResult.error)
            }, { status: 400 });
        }

        const { data } = parseResult;
        const db = await getConnection();
        const repository = db.getRepository(Brand);

        const brand = await repository.findOne({ where: { id: data.id } });
        if (!brand) {
            return NextResponse.json({ success: false, error: "Brand not found" }, { status: 404 });
        }

        const existingBrand = await repository.findOne({ where: { name: data.name } });
        if (existingBrand && existingBrand.id !== data.id) {
            return NextResponse.json({
                success: false,
                error: "Brand with the same name already exists"
            }, { status: 409 });
        }

        brand.name = data.name;
        await repository.save(brand); // .save() is generally preferred over .update() in TypeORM if you already loaded the entity

        return NextResponse.json({
            success: true,
            data: brand,
        }, { status: 200 });

    } catch (error) {
        console.error("PUT Brand Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const json = await request.json();
        const parseResult = z.object({
            id: z.string().uuid(),
        }).safeParse(json);

        if (!parseResult.success) {
            return NextResponse.json({
                success: false,
                error: "Invalid request body",
                details: z.flattenError(parseResult.error)
            }, { status: 400 });
        }

        const { data } = parseResult;
        const db = await getConnection();
        const repository = db.getRepository(Brand);

        const brand = await repository.findOne({ where: { id: data.id } });
        if (!brand) {
            return NextResponse.json({ success: false, error: "Brand not found" }, { status: 404 });
        }

        await repository.remove(brand);

        return NextResponse.json({
            success: true,
            data: null,
        }, { status: 200 });

    } catch (error) {
        console.error("DELETE Brand Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}