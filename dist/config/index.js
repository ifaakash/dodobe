"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), envFile) });
exports.config = {
    env: process.env.NODE_ENV || "development",
    port: 3002,
    mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/dodo",
    jwtSecret: process.env.JWT_SECRET || "your-default-secret-key-for-development",
    uploadDir: process.env.UPLOAD_DIR || "uploads",
    baseUrl: process.env.BASE_URL || "http://localhost:3002",
};
// Test environment specific overrides
if (process.env.NODE_ENV === "test") {
    exports.config.mongoUri =
        process.env.TEST_MONGODB_URI || "mongodb://localhost:27017/dodo-test";
    exports.config.uploadDir = "test-uploads";
}
