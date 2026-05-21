import { diagnosticCodeSchema } from '@/schemas/diagnostic';
import { getConnection } from '@/connection';
import { DiagnosticCode, DTCCategory } from '@/entities/DiagnosticCode';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function GET(req: NextRequest, res: NextResponse) {
    const searchParams = new URL(req.url).searchParams;

    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 10; // Jumlah data per halaman
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1; // Halaman yang diminta (1-based index)
    const offset = (page - 1) * limit; // Hitung offset untuk pagination

    const db = await getConnection();
    const repository = db.getRepository(DiagnosticCode);

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

export async function POST(req: NextRequest, res: NextResponse) {
    const json = await req.json();
    const patch = diagnosticCodeSchema.safeParse(json);
    if (!patch.success) {
        return NextResponse.json({
            success: false,
            errors: z.treeifyError(patch.error)
        }, { status: 400 });
    }
    const db = await getConnection();
    const repository = db.getRepository(DiagnosticCode);
    const diagnosticCode = repository.create({
        code: patch.data.code,
        brand: patch.data.brandId ? { id: patch.data.brandId } : null,
        category: patch.data.brandId ? DTCCategory.SPECIFIC : DTCCategory.GENERIC,
        description: patch.data.description,
        symptoms: patch.data.symptoms,
        causes: patch.data.causes,
        solutions: patch.data.solutions
    });
    await repository.save(diagnosticCode);
    return NextResponse.json({
        success: true,
        data: diagnosticCode
    });

}

export async function DELETE(req: NextRequest, res: NextResponse) {
    const searchParams = new URL(req.url).searchParams;
    const id = searchParams.get('id');
    if (!id) {
        return NextResponse.json({
            success: false,
            error: "ID is required"
        }, { status: 400 });
    }
    const db = await getConnection();
    const repository = db.getRepository(DiagnosticCode);
    const diagnosticCode = await repository.findOneBy({ id });
    if (!diagnosticCode) {
        return NextResponse.json({
            success: false,
            error: "Diagnostic code not found"
        }, { status: 404 });
    }
    await repository.remove(diagnosticCode);
    return NextResponse.json({
        success: true,
        message: "Diagnostic code deleted successfully"
    });
}

export async function PUT(req: NextRequest, res: NextResponse) {
    const json = await req.json();
    const patch = diagnosticCodeSchema.partial().safeParse(json);
    if (!patch.success) {
        return NextResponse.json({
            success: false,
            errors: z.treeifyError(patch.error)
        }, { status: 400 });
    }
    if (!patch.data.code) {
        return NextResponse.json({
            success: false,
            error: "Code is required for update"
        }, { status: 400 });
    }
    const db = await getConnection();
    const repository = db.getRepository(DiagnosticCode);
    const diagnosticCode = await repository.findOneBy({ code: patch.data.code });
    if (!diagnosticCode) {
        return NextResponse.json({
            success: false,
            error: "Diagnostic code not found"
        }, { status: 404 });
    }

    const currentData = {
        code: diagnosticCode.code,
        brandId: diagnosticCode.brand ? diagnosticCode.brand.id : null,
        category: diagnosticCode.category,
        description: diagnosticCode.description,
        symptoms: diagnosticCode.symptoms,
        causes: diagnosticCode.causes,
        solutions: diagnosticCode.solutions
    }

    if (patch.data.brandId !== undefined) {
        currentData.brandId = patch.data.brandId;
        currentData.category = patch.data.brandId ? DTCCategory.SPECIFIC : DTCCategory.GENERIC;
    }
    if (patch.data.description !== undefined) {
        currentData.description = patch.data.description;
    }
    if (patch.data.symptoms !== undefined) {
        currentData.symptoms = patch.data.symptoms;
    }
    if (patch.data.causes !== undefined) {
        currentData.causes = patch.data.causes;
    }
    if (patch.data.solutions !== undefined) {
        currentData.solutions = patch.data.solutions;
    }

    await repository.update({ code: patch.data.code }, {
        brand: currentData.brandId ? { id: currentData.brandId } : null,
        category: currentData.category,
        description: currentData.description,
        symptoms: currentData.symptoms,
        causes: currentData.causes,
        solutions: currentData.solutions
    });
    return NextResponse.json({
        success: true,
        data: {
            id: diagnosticCode.id,  
            ...currentData
        }
    });
}