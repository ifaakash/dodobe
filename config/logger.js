const winston = require("winston");
const path = require("path");

// Custom format for console output
const consoleFormat = winston.format.printf(
    ({ level, message, timestamp, ...metadata }) => {
        const metadataStr = Object.keys(metadata).length
            ? `\n${JSON.stringify(metadata, null, 2)}`
            : "";

        return `${timestamp} | ${level
            .toUpperCase()
            .padEnd(7)} | ${message}${metadataStr}`;
    }
);

const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: winston.format.combine(
        winston.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join(__dirname, "../logs/error.log"),
            level: "error",
        }),
        new winston.transports.File({
            filename: path.join(__dirname, "../logs/combined.log"),
        }),
    ],
});

// Add console transport in non-production
if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize({ all: true }),
                winston.format.timestamp({
                    format: "YYYY-MM-DD HH:mm:ss",
                }),
                consoleFormat
            ),
        })
    );
}

module.exports = logger;
