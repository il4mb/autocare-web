import { NextResponse } from 'next/server';
import { getConnection } from "@/connection";
import { Brand } from "@/entities/Brand";

export async function GET() {

    const limit = 10; // Jumlah data per halaman
    const page = 1; // Halaman yang diminta (1-based index)
    const offset = (page - 1) * limit; // Hitung offset untuk pagination

    const db = await getConnection();
    const repository = db.getRepository(Brand);

    const totalBrands = await repository.count(); // Hitung total data untuk metadata
    const brands = await repository.find({
        skip: offset,
        take: limit
    });

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
}