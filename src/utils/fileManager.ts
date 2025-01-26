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
}
