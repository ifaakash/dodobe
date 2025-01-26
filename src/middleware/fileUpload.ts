import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = "uploads/";

        if (file.fieldname === "profilePicture") {
            uploadPath += "profiles/";
        } else if (file.fieldname === "audioBio") {
            uploadPath += "audio/";
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            file.fieldname +
                "-" +
                uniqueSuffix +
                path.extname(file.originalname)
        );
    },
});

const fileFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (file.fieldname === "profilePicture") {
        if (!file.mimetype.startsWith("image/")) {
            cb(null, false);
            return;
        }
    } else if (file.fieldname === "audioBio") {
        if (!file.mimetype.startsWith("audio/")) {
            cb(null, false);
            return;
        }
    }
    cb(null, true);
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
