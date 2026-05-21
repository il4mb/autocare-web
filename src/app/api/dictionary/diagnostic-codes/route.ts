import { diagnosticCodeSchema } from '@/schemas/diagnostic';
import { getConnection } from '@/connection';
import { DiagnosticCode, DTCCategory } from '@/entities/DiagnosticCode';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;

        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const offset = (page - 1) * limit;

        const db = await getConnection();
        const repository = db.getRepository(DiagnosticCode);
        const qb = repository.createQueryBuilder('diagnostic_code')
            .leftJoinAndSelect('diagnostic_code.brand', 'brand')
            .skip(offset)
            .take(limit)
            .orderBy('diagnostic_code.createdAt', 'DESC');

        if (searchParams.get('search')) {
            const search = `%${searchParams.get('search')}%`;
            qb.where('diagnostic_code.code LIKE :search OR diagnostic_code.description LIKE :search', { search });
        }

        const [diagnosticCodes, totalCodes] = await qb.getManyAndCount();

        return NextResponse.json({
            success: true,
            data: diagnosticCodes,
            metadata: {
                total: totalCodes,
                page: page,
                limit: limit,
                totalPages: Math.ceil(totalCodes / limit)
            }
        });
    } catch (error) {
        console.error("GET DiagnosticCode Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const json = await req.json();
        const patch = diagnosticCodeSchema.safeParse(json);

        if (!patch.success) {
            return NextResponse.json({
                success: false,
                errors: z.flattenError(patch.error)
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
        }, { status: 201 });

    } catch (error) {
        console.error("POST DiagnosticCode Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const json = await req.json();
        const patch = diagnosticCodeSchema.partial().safeParse(json);

        if (!patch.success) {
            return NextResponse.json({
                success: false,
                errors: z.flattenError(patch.error)
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
            currentData.brandId = patch.data.brandId ?? null;
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

    } catch (error) {
        console.error("PUT DiagnosticCode Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
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

    } catch (error) {
        console.error("DELETE DiagnosticCode Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}