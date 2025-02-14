import multer from "multer";
import path from "path";
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

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
    folder: "dodo-profiles" | "dodo-audio"
) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: `${folder}/${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read" as const,
    };

    await s3.send(new PutObjectCommand(params));
    return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
};
