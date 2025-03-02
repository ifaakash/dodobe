import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { logger } from "../utils/logger";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
    };
}

export const authenticateUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }

        const token = authHeader.split("Bearer ")[1];

        try {
            // For testing purposes, allow a special test token
            if (process.env.NODE_ENV === "test" && token === "test-token") {
                req.user = { userId: "test-user-id" };
                return next();
            }

            const decoded = jwt.verify(token, config.jwtSecret) as {
                userId: string;
            };
            req.user = { userId: decoded.userId };
            next();
        } catch (error) {
            logger.error("Authentication error:", error);
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }
    } catch (error) {
        logger.error("Authentication error:", error);
        return res.status(500).json({
            success: false,
            message: "Authentication failed",
        });
    }
};
