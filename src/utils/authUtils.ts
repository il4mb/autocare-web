import { getConnection } from "@/connection";
import { User } from "@/entities/User";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { MoreThan } from "typeorm";

const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) {
    throw new Error("FRONTEND_URL is not defined in environment variables");
}

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_FROM_EMAIL;
const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP_USER and SMTP_PASS must be defined in environment variables");
}

const resolveSenderAddress = (): string => {
    if (SMTP_FROM && EMAIL_ADDRESS_PATTERN.test(SMTP_FROM)) {
        return SMTP_FROM;
    }

    if (EMAIL_ADDRESS_PATTERN.test(SMTP_USER)) {
        return SMTP_USER;
    }

    const frontendHost = new URL(FRONTEND_URL).hostname;
    return `no-reply@${frontendHost}`;
};

// Konfigurasi transporter menggunakan kredensial SMTP dari .env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true", // true untuk port 465, false untuk port lainnya
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS, // Gunakan App Password jika menggunakan Gmail
    },
});

export const sendResetEmail = async (email: string, token: string) => {
    try {
        const senderAddress = resolveSenderAddress();

        const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;

        const mailOptions = {
            from: {
                name: "AutoCare Support",
                address: senderAddress,
            },
            envelope: {
                from: senderAddress,
                to: email,
            },
            to: email,
            subject: "Permintaan Reset Kata Sandi - AutoCare",
            text: `Anda meminta untuk mereset kata sandi Anda. Silakan klik tautan berikut untuk melanjutkan: ${resetLink}`,
            html: `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #0f172a; text-align: center;">Reset Kata Sandi</h2>
                    <p style="color: #475569; line-height: 1.6;">Halo,</p>
                    <p style="color: #475569; line-height: 1.6;">Kami menerima permintaan untuk mereset kata sandi akun AutoCare Anda. Silakan klik tombol di bawah ini untuk mengatur ulang kata sandi Anda:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #0252ff; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Reset Kata Sandi
                        </a>
                    </div>
                    
                    <p style="color: #475569; line-height: 1.6;">Atau salin dan tempel tautan berikut di browser Anda:</p>
                    <p style="word-break: break-all; color: #0252ff;">${resetLink}</p>
                    
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                        Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan email ini. Tautan ini hanya berlaku sementara.
                    </p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email reset terkirim: %s", info.messageId);

    } catch (error) {
        console.error("Gagal mengirim email reset:", error);
        throw new Error("Gagal mengirim email pengaturan ulang kata sandi.");
    }
};

export const generateResetToken = (): string => {
    // Menghasilkan token acak sepanjang 64 karakter (32 bytes hex)
    const token = randomBytes(32).toString("hex");

    // CATATAN PENTING: 
    // Di tempat Anda memanggil fungsi ini (di dalam controller), 
    // Anda harus MENYIMPAN token ini ke database beserta userId dan waktu kedaluwarsa (expiresAt).
    // Contoh: await db.query("UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?", [token, Date.now() + 3600000, userId]);

    return token;
};

/**
 * Memverifikasi apakah token reset valid dan belum kedaluwarsa.
 */
export const verifyResetToken = async (token: string) => {
    const db = await getConnection();
    const repository = db.getRepository(User);
    const user = await repository.findOne({
        where: {
            resetToken: token,
            resetTokenExpiry: MoreThan(new Date()) // Pastikan token belum kedaluwarsa
        }
    });

    if (!user) return null;
    return user;
}