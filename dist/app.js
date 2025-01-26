"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const routes_1 = require("./routes");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const database_1 = require("./config/database");
// Create Express app
const app = (0, express_1.default)();
exports.app = app;
// Middleware
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// Static file serving
app.use("/uploads", express_1.default.static("uploads"));
// Routes
app.use(routes_1.apiRouter);
// Error handling middleware
app.use((err, req, res, next) => {
    logger_1.logger.error("Unhandled error:", err);
    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
});
// Only start the server if we're not in a test environment
if (process.env.NODE_ENV !== 'test') {
    (0, database_1.connectDB)()
        .then(() => {
        app.listen(config_1.config.port, () => {
            logger_1.logger.info(`Server running on port ${config_1.config.port}`);
        });
    })
        .catch((err) => {
        logger_1.logger.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    });
}
app.get('/api/resource', (req, res) => {
    console.log('API hit');
    res.status(200).json({ message: 'Success' });
});
