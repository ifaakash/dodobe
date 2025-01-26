import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { logger } from "../utils/logger";

export const handleFileUploadError = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (error instanceof MulterError) {
        logger.error("File upload error:", error);
        switch (error.code) {
            case "LIMIT_FILE_SIZE":
                res.status(400).json({
                    success: false,
                    message: "File is too large. Maximum size is 5MB",
                });
                break;
            case "LIMIT_UNEXPECTED_FILE":
                res.status(400).json({
                    success: false,
                    message: "Unexpected field in file upload",
                });
                break;
            default:
                res.status(400).json({
                    success: false,
                    message: "Error uploading file",
                });
        }
        return;
    }
    next(error);
};
