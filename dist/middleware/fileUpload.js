"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteS3File = exports.uploadToS3 = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
dotenv_1.default.config();
const s3 = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const storage = multer_1.default.memoryStorage();
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/") ||
            file.mimetype.startsWith("audio/")) {
            cb(null, true);
        }
        else {
            cb(new Error("Only image and audio files are allowed!"));
        }
    },
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB (audio files need more space)
    },
});
const uploadToS3 = async (file, folder) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${folder}/${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
    };
    await s3.send(new client_s3_1.PutObjectCommand(params));
    return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
};
exports.uploadToS3 = uploadToS3;
const deleteS3File = async (url) => {
    if (!url)
        return;
    try {
        // Parse S3 URL format: https://{bucket}.s3.{region}.amazonaws.com/{key}
        const urlPattern = /https:\/\/(.+?)\.s3\.(.+?)\.amazonaws\.com\/(.*)/;
        const matches = url.match(urlPattern);
        if (!matches || matches.length < 4) {
            throw new Error(`Invalid S3 URL format: ${url}`);
        }
        const Bucket = matches[1];
        const Key = matches[3];
        await s3.send(new client_s3_1.DeleteObjectCommand({ Bucket, Key }));
    }
    catch (error) {
        logger_1.logger.error(`Error deleting S3 file ${url}:`, error);
        throw error; // Re-throw to handle in controllers
    }
};
exports.deleteS3File = deleteS3File;
