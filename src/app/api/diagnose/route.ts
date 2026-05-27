import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/connection';
import { DiagnosticCode } from '@/entities/DiagnosticCode';
import { Brand } from '@/entities/Brand';
import { Brackets } from 'typeorm';

export const GET = async (request: NextRequest) => {
    try {
        const { searchParams } = new URL(request.url);

        // Ambil parameter dari request
        const codesParam = searchParams.get('codes'); // Misal: "P0133,P0204"
        const modelId = searchParams.get('model');    // ID brand/model jika ada

        // Jika tidak ada kode yang dikirim, langsung kembalikan array kosong (Sehat)
        if (!codesParam) {
            return NextResponse.json({ success: true, data: [] }, { status: 200 });
        }

        // Pecah string "P0133,P0204" menjadi array ["P0133", "P0204"]
        const dtcList = codesParam.split(',').map(code => code.trim().toUpperCase());

        // Pastikan array tidak kosong setelah di-split
        if (dtcList.length === 0) {
            return NextResponse.json({ success: true, data: [] }, { status: 200 });
        }

        const db = await getConnection();
        const diagCodeRepository = db.getRepository(DiagnosticCode);
        const brandRepository = db.getRepository(Brand); // Pastikan ini sesuai dengan nama entitas Brand Anda

        // Buat Query Menggunakan TypeORM QueryBuilder
        const query = diagCodeRepository.createQueryBuilder("diag")
            .where("diag.code IN (:...dtcList)", { dtcList });

        let brand: Brand | null = null;
        // Filter tambahan berdasarkan Kategori (Generic / Specific)
        if (modelId) {
            // Jika user memilih model kendaraan:
            // Ambil kode 'generic' ATAU kode 'specific' yang sesuai dengan modelId-nya
            query.andWhere(new Brackets(qb => {
                qb.where("diag.category = :generic", { generic: 'generic' })
                    .orWhere("(diag.category = :specific AND diag.brand_id = :modelId)", {
                        specific: 'specific',
                        modelId: modelId
                    });
            }));
            brand = await brandRepository.findOne({ where: { id: modelId } });
        } else {
            // Jika user tidak memilih model, hanya ambil yang arti umum (generic) saja
            query.andWhere("diag.category = :generic", { generic: 'generic' });
        }

        // Eksekusi query
        const results = await query.getMany();

        // Kembalikan response yang sesuai dengan format yang diharapkan frontend
        return NextResponse.json({
            success: true,
            data: results,
            brand: brand ? { id: brand.id, name: brand.name } : null
        }, { status: 200 });

    } catch (error: any) {
        console.error("Diagnostic API Error:", error);

        return NextResponse.json({
            success: false,
            message: "Terjadi kesalahan internal pada server saat menganalisa diagnosa."
        }, { status: 500 });
    }
}