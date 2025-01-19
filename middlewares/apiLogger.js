const logger = require("../config/logger");

const apiLogger = (req, res, next) => {
    const start = Date.now();

    const logRequest = () => {
        const responseTime = Date.now() - start;
        const userId = req.user?.userId || "anonymous";

        const logData = {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userId,
            ...(req.method !== "GET" && { body: req.body }),
        };

        const message = `${req.method} ${req.originalUrl}`;
        logger.info(message, logData);
    };

    // Log after response is sent
    res.on("finish", logRequest);
    next();
};

module.exports = apiLogger;
