import { getConnection } from "@/connection";
import { User } from "@/entities/User";
import { verifyToken } from "@/jwt";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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
            // Set Cache-Control header to prevent caching of sensitive user data
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
