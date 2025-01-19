const logger = require("../config/logger");

const errorLogger = (err, req, res, next) => {
    logger.app.error({
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        query: req.query,
        params: req.params,
        userId: req.user?.userId || null,
        timestamp: new Date().toISOString(),
    });

    next(err);
};

module.exports = errorLogger;
