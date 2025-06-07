"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const connectDB = async () => {
    try {
        // add ?authSource=admin for local mongo
        const mongoURI = process.env.MONGODB_URI ||
            "mongodb+srv://dodo:dodopassword@dodo-cluster.lkk05.mongodb.net/?retryWrites=true&w=majority&appName=dodo-cluster";
        await mongoose_1.default.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        logger_1.logger.info("MongoDB Connected Successfully");
        // Handle connection errors after initial connection
        mongoose_1.default.connection.on("error", (err) => {
            logger_1.logger.error("MongoDB connection error:", err);
        });
        mongoose_1.default.connection.on("disconnected", () => {
            logger_1.logger.warn("MongoDB disconnected. Attempting to reconnect...");
        });
    }
    catch (err) {
        logger_1.logger.error("MongoDB connection error:", err);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
