import jwt from "jsonwebtoken";
import { config } from "../config";

export const generateToken = (userId: string): string => {
    return jwt.sign(
        { userId },
        config.jwtSecret,
        { expiresIn: "7d" } // Token expires in 7 days
    );
};

export const verifyToken = (token: string): { userId: string } => {
    return jwt.verify(token, config.jwtSecret) as { userId: string };
};
