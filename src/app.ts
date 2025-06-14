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
                url: "http://localhost:3002", // This will be dynamically updated
                description: "API Server",
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
    servers: Array<{ url: string; description: string }>;
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

// Swagger UI setup with dynamic server URL
app.use(
    "/api-docs",
    (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        // Get the actual server URL from request headers
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const host = req.headers["x-forwarded-host"] || req.get("host");
        const baseUrl = `${protocol}://${host}`;

        // Update the server URL in the swagger spec
        swaggerSpec.servers = [
            {
                url: baseUrl,
                description: "API Server",
            },
        ];

        // Set the server URL in the response headers
        res.setHeader("X-Swagger-Server-URL", baseUrl);

        next();
    },
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
            requestInterceptor: (req: any) => {
                // Get the server URL from the response headers
                const serverUrl = req.headers["x-swagger-server-url"];
                if (serverUrl) {
                    // Update the request URL to use the correct server
                    req.url = req.url.replace(
                        /^http:\/\/localhost:3002/,
                        serverUrl
                    );
                }
                return req;
            },
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
