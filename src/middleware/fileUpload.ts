import multer from "multer";
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { logger } from "../utils/logger";

dotenv.config();

const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const storage = multer.memoryStorage();

export const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype.startsWith("image/") ||
            file.mimetype.startsWith("audio/")
        ) {
            cb(null, true);
        } else {
            cb(new Error("Only image and audio files are allowed!"));
        }
    },
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB (audio files need more space)
    },
});

export const uploadToS3 = async (
    file: Express.Multer.File,
    folder: "dodo-profiles" | "dodo-audio" | "block-images"
) => {
    logger.info('Attempting S3 upload:', { filename: file.originalname, folder });
    const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: `${folder}/${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read" as const,
    };

    await s3.send(new PutObjectCommand(params));
    const fileUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    return fileUrl;
};

export const deleteS3File = async (url?: string): Promise<void> => {
    if (!url) return;

    logger.info('Attempting to delete S3 file:', { url });
    try {
        // Parse S3 URL format: https://{bucket}.s3.{region}.amazonaws.com/{key}
        const urlPattern = /https:\/\/(.+?)\.s3\.(.+?)\.amazonaws\.com\/(.*)/;
        const matches = url.match(urlPattern);

        if (!matches || matches.length < 4) {
            throw new Error(`Invalid S3 URL format: ${url}`);
        }

        const Bucket = matches[1];
        const Key = matches[3];

        await s3.send(new DeleteObjectCommand({ Bucket, Key }));
    } catch (error) {
        logger.error(`Error deleting S3 file ${url}:`, error);
        throw error; // Re-throw to handle in controllers
    }
};