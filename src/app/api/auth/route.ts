import { loginSchema } from "@/schemas/auth";
import { NextRequest } from "next/server";
import { getConnection } from "@/connection";
import { User } from "@/entities/User";
import bcrypt from "bcrypt";
import { generateToken } from "@/jwt";
import { cookies } from "next/headers";

export const POST = async (request: NextRequest) => {

    const json = await request.json();
    const { success, data: patch } = loginSchema.safeParse(json);
    if (!success) {
        return new Response(JSON.stringify({
            success: false,
            error: "Invalid request body"
        }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    const db = await getConnection();
    const repository = db.getRepository(User);
    const user = await repository.findOne({ where: { email: patch.email } });

    if (!user) {
        return new Response(JSON.stringify({
            success: false,
            error: "Invalid email or password"
        }), {
            status: 401,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    const cookieJar = await cookies();
    const isPasswordValid = await bcrypt.compare(patch.password, user.password);
    if (!isPasswordValid) {
        return new Response(JSON.stringify({
            success: false,
            error: "Invalid email or password"
        }), {
            status: 401,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }


    const payload = {
        uid: user.id,
        created_at: Date.now(),
    }
    const token = generateToken(payload, "7d"); // Token valid for 7 days
    cookieJar.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    // Here you would typically generate a JWT token and return it to the client
    return new Response(JSON.stringify({
        success: true,
        message: "Login successful"
    }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
}

export const DELETE = async () => {
    const cookieJar = await cookies();
    cookieJar.delete("auth_token");

    return new Response(JSON.stringify({
        success: true,
        message: "Logout successful"
    }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
}
