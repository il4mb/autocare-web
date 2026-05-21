import { DataSource } from "typeorm";
import { Brand } from "./entities/Brand";
import { DiagnosticCode } from "./entities/DiagnosticCode";

const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

if (!DB_HOST || !DB_PORT || !DB_USERNAME || !DB_PASSWORD || !DB_NAME) {
    console.error("Error: Missing one or more required environment variables for database connection.");
    console.error("Please ensure DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, and DB_NAME are set.");
    process.exit(1); // Exit the application with an error code
}

const db = new DataSource({
    type: "mysql",
    host: DB_HOST,
    port: parseInt(DB_PORT),
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
    entities: [
        Brand,
        DiagnosticCode
    ],
    synchronize: true, // Hati-hati dengan opsi ini di production
});

export const getConnection = async () => {
    if (!db.isInitialized) {
        try {
            await db.initialize();
            console.log("Database connection established successfully.");
        } catch (error) {
            console.error("Error initializing database connection:", error);
            throw error; // Rethrow the error after logging it
        }
    }
    return db;
}