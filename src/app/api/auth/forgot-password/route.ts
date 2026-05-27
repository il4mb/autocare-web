import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getConnection } from "@/connection";
import { User } from "@/entities/User";
import { generateResetToken, sendResetEmail } from "@/utils/authUtils";
import { MoreThan } from "typeorm";
import bcrypt from "bcrypt";

// Skema validasi untuk forgot password
const forgotPasswordSchema = z.object({
    email: z.email({ message: "Format email tidak valid" })
});

export const POST = async (request: NextRequest) => {
    try {
        const json = await request.json();
        const parseResult = forgotPasswordSchema.safeParse(json);
        if (!parseResult.success) {
            return NextResponse.json({ success: false, error: z.flattenError(parseResult.error) }, { status: 400 });
        }
        const { email } = parseResult.data;

        const db = await getConnection();
        const repository = db.getRepository(User);
        const user = await repository.findOne({ where: { email } });
        if (!user) {
            // Untuk keamanan, kita tetap kembalikan response sukses meskipun email tidak ditemukan
            return NextResponse.json({ success: true, message: "Jika email terdaftar, instruksi reset password akan dikirim." }, { status: 200 });
        }
        // Generate token reset password (misal menggunakan JWT atau UUID)
        const resetToken = generateResetToken();
        // Simpan token ini di database dengan masa berlaku tertentu (misal 1 jam)
        const expiryDate = new Date(Date.now() + 3600000); // 1 jam dari sekarang
        await repository.update(user.id, { resetToken, resetTokenExpiry: expiryDate });
        // Kirim email ke user dengan link reset password yang berisi token
        await sendResetEmail(user.email, resetToken);
        return NextResponse.json({ success: true, message: "Jika email terdaftar, instruksi reset password akan dikirim." }, { status: 200 });
    } catch (error) {
        console.error("POST /auth/forgot-password Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}


export const PUT = async (request: NextRequest) => {
    try {
        const json = await request.json();
        const { token, newPassword } = json;

        if (typeof token !== "string" || typeof newPassword !== "string" || newPassword.length < 6) {
            return NextResponse.json({ success: false, error: "Invalid token or password" }, { status: 400 });
        }

        const db = await getConnection();
        const repository = db.getRepository(User);
        const user = await repository.findOne({
            where: {
                resetToken: token,
                resetTokenExpiry: MoreThan(new Date()) // Pastikan token belum kedaluwarsa
            }
        });

        if (!user) {
            return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 400 });
        }

        // Update password user
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await repository.update(user.id, {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null
        });
        return NextResponse.json({ success: true, message: "Password berhasil direset" }, { status: 200 });
    } catch (error) {
        console.error("PUT /auth/forgot-password Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
