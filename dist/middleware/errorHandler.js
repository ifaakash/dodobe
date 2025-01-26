"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFileUploadError = void 0;
const multer_1 = require("multer");
const logger_1 = require("../utils/logger");
const handleFileUploadError = (error, req, res, next) => {
    if (error instanceof multer_1.MulterError) {
        logger_1.logger.error("File upload error:", error);
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
exports.handleFileUploadError = handleFileUploadError;
