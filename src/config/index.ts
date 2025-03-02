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
}

export const config: Config = {
    env: process.env.NODE_ENV || "development",
    port: 3002,
    mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/dodo",
    jwtSecret:
        process.env.JWT_SECRET || "your-default-secret-key-for-development",
    uploadDir: process.env.UPLOAD_DIR || "uploads",
    baseUrl: process.env.BASE_URL || "http://localhost:3002",
};

// Test environment specific overrides
if (process.env.NODE_ENV === "test") {
    config.mongoUri =
        process.env.TEST_MONGODB_URI || "mongodb://localhost:27017/dodo-test";
    config.uploadDir = "test-uploads";
}
