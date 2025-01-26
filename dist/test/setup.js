"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("../app");
const block_1 = require("@/routes/block");
const auth_1 = require("@/routes/auth");
let mongo;
// Increase timeout for setup
jest.setTimeout(30000);
beforeAll(async () => {
    try {
        // Setup MongoDB Memory Server
        mongo = await mongodb_memory_server_1.MongoMemoryServer.create();
        const mongoUri = mongo.getUri();
        // Close any existing connections
        await mongoose_1.default.disconnect();
        // Connect to the in-memory database
        await mongoose_1.default.connect(mongoUri);
        if (!mongoose_1.default.connection.db) {
            throw new Error("MongoDB connection failed");
        }
        // Register routes for testing
        app_1.app.use("/api/v1/block", block_1.blockRouter);
        app_1.app.use("/api/v1/auth", auth_1.authRouter);
    }
    catch (error) {
        console.error("Error in test setup:", error);
        throw error;
    }
});
beforeEach(async () => {
    try {
        // Clear all collections before each test
        const collections = await mongoose_1.default.connection.db?.collections();
        if (collections) {
            for (let collection of collections) {
                await collection.deleteMany({});
            }
        }
    }
    catch (error) {
        console.error("Error in test cleanup:", error);
        throw error;
    }
});
afterAll(async () => {
    try {
        if (mongoose_1.default.connection) {
            await mongoose_1.default.connection.close();
        }
        if (mongo) {
            await mongo.stop();
        }
    }
    catch (error) {
        console.error("Error in test teardown:", error);
        throw error;
    }
});
