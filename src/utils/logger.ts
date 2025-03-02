import winston from "winston";

// Custom format for console output
const consoleFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: `;
  
  // Handle object messages
  if (typeof message === 'object') {
    msg += JSON.stringify(message, null, 2);
  } else {
    msg += message;
  }
  
  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += ` | ${JSON.stringify(metadata, null, 2)}`;
  }
  
  return msg;
});

export const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" }),
    ],
});

if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({
                    format: "YYYY-MM-DD HH:mm:ss",
                }),
                consoleFormat
            ),
        })
    );
}

// Add utility functions for logging endpoints and errors
export const logEndpoint = (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Once the response is finished, log the details
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info({
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

export const logError = (err: Error, req?: any, res?: any) => {
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
    
    logger.error(errorDetails);
};
