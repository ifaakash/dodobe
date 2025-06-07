"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.logEndpoint = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
// Custom format for console output
const consoleFormat = winston_1.default.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: `;
    // Handle object messages
    if (typeof message === 'object') {
        msg += JSON.stringify(message, null, 2);
    }
    else {
        msg += message;
    }
    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
        msg += ` | ${JSON.stringify(metadata, null, 2)}`;
    }
    return msg;
});
exports.logger = winston_1.default.createLogger({
    level: "info",
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.File({ filename: "error.log", level: "error" }),
        new winston_1.default.transports.File({ filename: "combined.log" }),
    ],
});
if (process.env.NODE_ENV !== "production") {
    exports.logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }), consoleFormat),
    }));
}
// Add utility functions for logging endpoints and errors
const logEndpoint = (req, res, next) => {
    const startTime = Date.now();
    // Once the response is finished, log the details
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        exports.logger.info({
            type: 'endpoint',
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        });
    });
    next();
};
exports.logEndpoint = logEndpoint;
const logError = (err, req, res) => {
    const errorDetails = {
        type: 'error',
        message: err.message,
        stack: err.stack,
    };
    // Add request details if available
    if (req) {
        Object.assign(errorDetails, {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            body: req.body,
            params: req.params,
            query: req.query,
        });
    }
    // Add response details if available
    if (res) {
        Object.assign(errorDetails, {
            statusCode: res.statusCode,
        });
    }
    exports.logger.error(errorDetails);
};
exports.logError = logError;
