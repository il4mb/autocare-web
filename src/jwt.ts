import * as jsonwebtoken from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET: Secret = process.env.JWT_SECRET as Secret;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}

export const generateToken = (payload: object, expiresIn: SignOptions["expiresIn"] = "1h") => {
    return jsonwebtoken.sign(payload, JWT_SECRET, { expiresIn });
}

export const verifyToken = (token: string) => {
    try {
        return jsonwebtoken.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}