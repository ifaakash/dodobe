import dotenv from "dotenv";
import path from "path";

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

interface Config {
    env: string;
    port: number;
    mongoUri: string;
    jwtSecret: string;
    uploadDir: string;
    baseUrl: string;
    email: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
        from: string;
        adminEmail: string;
    };
}

export const config: Config = {
    env: process.env.NODE_ENV || "development",
    port: 3002,
    mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/dodo",
    jwtSecret:
        process.env.JWT_SECRET || "your-default-secret-key-for-development",
    uploadDir: process.env.UPLOAD_DIR || "uploads",
    baseUrl: process.env.BASE_URL || "http://localhost:3002",
    email: {
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_SECURE === "true",
        user: process.env.EMAIL_USER || "work.dodoclub@gmail.com",
        pass: process.env.EMAIL_PASS || "",
        from: process.env.EMAIL_FROM || "work.dodoclub@gmail.com",
        adminEmail: process.env.ADMIN_EMAIL || "work.dodoclub@gmail.com",
    },
};

// Test environment specific overrides
if (process.env.NODE_ENV === "test") {
    config.mongoUri =
        process.env.TEST_MONGODB_URI || "mongodb://localhost:27017/dodo-test";
    config.uploadDir = "test-uploads";
}
