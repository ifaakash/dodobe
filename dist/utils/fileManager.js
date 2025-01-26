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
    static getFileUrl(filePath) {
        if (!filePath)
            return undefined;
        return `${process.env.API_BASE_URL}/${filePath}`;
    }
}
exports.FileManager = FileManager;
