import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { apiRouter } from "./routes";
import { config } from "./config";
import { logger, logEndpoint } from "./utils/logger";
import { connectDB } from "./config/database";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

// Create Express app
const app = express();

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Media Kit API",
            version: "1.0.0",
            description: "API documentation for Media Kit management",
        },
        servers: [
            {
                url: "http://localhost:3002",
                description: "Local Development",
            },
            {
                url: "https://api.dodoclub.in",
                description: "Production API",
            },
            {
                url: "https://dodobe.onrender.com",
                description: "Render Deployment",
            },
            {
                url: "https://{customUrl}",
                description: "Custom Server (PR Preview)",
                variables: {
                    customUrl: {
                        default: "your-pr-preview-url.com",
                        description: "Enter your PR preview URL",
                    },
                },
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./src/docs/*.swagger.ts", "./dist/docs/*.swagger.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions) as {
    servers: Array<{ url: string; description: string; variables?: any }>;
};

// Middleware
app.use(cors());
app.use(
    bodyParser.json({
        type: ["application/json", "application/json; charset=utf-8"],
    })
);

// For raw blob data (may be needed for some Beacon implementations)
app.use(
    bodyParser.raw({
        type: "application/json",
        limit: "1mb", // Adjust limit as needed
    })
);

app.use(bodyParser.urlencoded({ extended: true }));

// Add endpoint logging middleware
app.use(logEndpoint);

// Swagger UI setup
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        swaggerOptions: {
            url: "/api-docs/swagger.json",
            persistAuthorization: true,
            docExpansion: "none",
            filter: true,
            showCommonExtensions: true,
            defaultModelsExpandDepth: -1,
            defaultModelExpandDepth: 3,
            displayRequestDuration: true,
            tryItOutEnabled: true,
        },
    })
);

// Static file serving
app.use("/uploads", express.static("uploads"));

// Routes
app.use(apiRouter);

// Error handling middleware
app.use(
    (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        // Use the enhanced logger for errors
        logger.error({
            type: "error",
            message: err.message,
            stack: err.stack,
            method: req.method,
            url: req.originalUrl,
            ip:
                req.ip ||
                req.headers["x-forwarded-for"] ||
                req.connection.remoteAddress,
            body: req.body,
            params: req.params,
            query: req.query,
        });

        res.status(500).json({
            success: false,
            message: "Internal server error: " + err.message,
        });
    }
);

// Only start the server if we're not in a test environment
if (process.env.NODE_ENV !== "test") {
    connectDB()
        .then(() => {
            app.listen(config.port, () => {
                logger.info(`Server running on port ${config.port}`);
                logger.info(
                    `Swagger documentation available at http://localhost:${config.port}/api-docs`
                );
            });
        })
        .catch((err) => {
            logger.error("Failed to connect to MongoDB:", err);
            process.exit(1);
        });
}

app.get("/api/resource", (req, res) => {
    // Replace console.log with logger
    logger.info({
        type: "custom",
        message: "API hit",
        endpoint: "/api/resource",
    });
    res.status(200).json({ message: "Success" });
});

export { app };
