"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = "uploads/";
        if (file.fieldname === "profilePicture") {
            uploadPath += "profiles/";
        }
        else if (file.fieldname === "audioBio") {
            uploadPath += "audio/";
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname +
            "-" +
            uniqueSuffix +
            path_1.default.extname(file.originalname));
    },
});
const fileFilter = (req, file, cb) => {
    if (file.fieldname === "profilePicture") {
        if (!file.mimetype.startsWith("image/")) {
            cb(null, false);
            return;
        }
    }
    else if (file.fieldname === "audioBio") {
        if (!file.mimetype.startsWith("audio/")) {
            cb(null, false);
            return;
        }
    }
    cb(null, true);
};
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
