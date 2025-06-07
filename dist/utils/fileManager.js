"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileManager = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const logger_1 = require("./logger");
class FileManager {
    static async deleteFile(filePath) {
        if (!filePath)
            return;
        try {
            await promises_1.default.unlink(filePath);
        }
        catch (error) {
            logger_1.logger.error(`Error deleting file ${filePath}:`, error);
        }
    }
    static async replaceFile(oldFilePath, newFilePath) {
        await this.deleteFile(oldFilePath);
    }
    static getFileUrl(s3Url) {
        return s3Url; // Directly return S3 URL
    }
    static async fileExists(filePath) {
        try {
            await promises_1.default.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    static async ensureDirectoryExists(dirPath) {
        try {
            await promises_1.default.access(dirPath);
        }
        catch {
            await promises_1.default.mkdir(dirPath, { recursive: true });
        }
    }
    static async createEmptyFile(filePath) {
        await promises_1.default.writeFile(filePath, "");
    }
}
exports.FileManager = FileManager;
