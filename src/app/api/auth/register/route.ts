import { NextRequest } from "next/server";
import { getConnection } from "@/connection";
import { User } from "@/entities/User";
import bcrypt from "bcrypt";
import { registerSchema } from "@/schemas/auth";
 
export const POST = async (request: NextRequest) => {
    const json = await request.json();
    const { success, data: patch } = registerSchema.safeParse(json);
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
    const existingUser = await repository.findOne({ where: { email: patch.email } });
    if (existingUser) {
        return new Response(JSON.stringify({
            success: false,
            error: "Email already in use"
        }), {
            status: 409,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    const hashedPassword = await bcrypt.hash(patch.password, 10);
    const newUser = repository.create({
        name: patch.name,
        email: patch.email,
        password: hashedPassword,
    });
    await repository.save(newUser);

    return new Response(JSON.stringify({
        success: true,
        message: "User registered successfully"
    }), {
        status: 201,
        headers: {
            "Content-Type": "application/json",
        },
    });
}