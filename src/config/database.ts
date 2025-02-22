import mongoose from "mongoose";
import { logger } from "../utils/logger";

export const connectDB = async () => {
    try {
        // add ?authSource=admin for local mongo
        const mongoURI =
            process.env.MONGODB_URI ||
            "mongodb+srv://dodo:dodopassword@dodo-cluster.lkk05.mongodb.net/?retryWrites=true&w=majority&appName=dodo-cluster";

        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        logger.info("MongoDB Connected Successfully");

        // Handle connection errors after initial connection
        mongoose.connection.on("error", (err) => {
            logger.error("MongoDB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            logger.warn("MongoDB disconnected. Attempting to reconnect...");
        });
    } catch (err) {
        logger.error("MongoDB connection error:", err);
        process.exit(1);
    }
};
