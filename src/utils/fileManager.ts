import fs from "fs/promises";
import path from "path";
import { logger } from "./logger";

export class FileManager {
    static async deleteFile(filePath: string | undefined): Promise<void> {
        if (!filePath) return;

        try {
            await fs.unlink(filePath);
        } catch (error) {
            logger.error(`Error deleting file ${filePath}:`, error);
        }
    }

    static async replaceFile(
        oldFilePath: string | undefined,
        newFilePath: string
    ): Promise<void> {
        await this.deleteFile(oldFilePath);
    }

    static getFileUrl(filePath: string | undefined): string | undefined {
        if (!filePath) return undefined;
        return `${process.env.API_BASE_URL}/${filePath}`;
    }

    public static async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    public static async ensureDirectoryExists(dirPath: string): Promise<void> {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    public static async createEmptyFile(filePath: string): Promise<void> {
        await fs.writeFile(filePath, "");
    }
}
