import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { app } from "../app";
import { blockRouter } from "@/routes/block";
import { authRouter } from "@/routes/auth";
import { dodoPageRouter } from "@/routes/dodoPage";
import fs from "fs/promises";

let mongo: MongoMemoryServer;

// Increase timeout for setup
jest.setTimeout(30000);

beforeAll(async () => {
    try {
        // Setup MongoDB Memory Server
        mongo = await MongoMemoryServer.create();
        const mongoUri = mongo.getUri();

        // Create upload directories
        await fs.mkdir("uploads/profiles", { recursive: true });
        await fs.mkdir("uploads/audio", { recursive: true });

        // Close any existing connections
        await mongoose.disconnect();

        // Connect to the in-memory database
        await mongoose.connect(mongoUri);

        if (!mongoose.connection.db) {
            throw new Error("MongoDB connection failed");
        }

        // Register routes for testing
        app.use("/api/v1/block", blockRouter);
        app.use("/api/v1/auth", authRouter);
        app.use("/api/v1/dodo-page", dodoPageRouter);
    } catch (error) {
        console.error("Error in test setup:", error);
        throw error;
    }
});

beforeEach(async () => {
    try {
        // Clear all collections before each test
        const collections = await mongoose.connection.db?.collections();
        if (collections) {
            for (let collection of collections) {
                await collection.deleteMany({});
            }
        }
    } catch (error) {
        console.error("Error in test cleanup:", error);
        throw error;
    }
});

afterAll(async () => {
    try {
        // Clean up upload directories
        await fs.rm("uploads", { recursive: true, force: true });

        if (mongoose.connection) {
            await mongoose.connection.close();
        }
        if (mongo) {
            await mongo.stop();
        }
    } catch (error) {
        console.error("Error in test teardown:", error);
        throw error;
    }
});
