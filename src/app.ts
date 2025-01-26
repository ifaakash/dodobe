import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { apiRouter } from "./routes";
import { config } from "./config";
import { logger } from "./utils/logger";
import { connectDB } from "./config/database";

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
        logger.error("Unhandled error:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
);

// Only start the server if we're not in a test environment
if (process.env.NODE_ENV !== 'test') {
    connectDB()
        .then(() => {
            app.listen(config.port, () => {
                logger.info(`Server running on port ${config.port}`);
            });
        })
        .catch((err) => {
            logger.error("Failed to connect to MongoDB:", err);
            process.exit(1);
        });
}

app.get('/api/resource', (req, res) => {
    console.log('API hit');
    res.status(200).json({ message: 'Success' });
});

export { app };
