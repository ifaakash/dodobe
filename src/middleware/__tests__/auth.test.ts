import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authenticateUser, AuthRequest } from "../auth";
import { config } from "../../config";

jest.mock("jsonwebtoken");
jest.mock("../../utils/logger", () => ({
    logger: {
        error: jest.fn(),
    },
}));

describe("Authentication Middleware", () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: jest.Mock;

    beforeEach(() => {
        mockRequest = {
            headers: {},
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        nextFunction = jest.fn();

        // Set NODE_ENV to test for our tests
        process.env.NODE_ENV = "test";
    });

    it("should return 401 if no authorization header is provided", async () => {
        await authenticateUser(
            mockRequest as AuthRequest,
            mockResponse as Response,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
            success: false,
            message: "No token provided",
        });
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 401 if authorization header does not start with Bearer", async () => {
        mockRequest.headers = { authorization: "InvalidFormat token123" };

        await authenticateUser(
            mockRequest as AuthRequest,
            mockResponse as Response,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
            success: false,
            message: "No token provided",
        });
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 401 if token is invalid", async () => {
        mockRequest.headers = { authorization: "Bearer invalidToken" };

        await authenticateUser(
            mockRequest as AuthRequest,
            mockResponse as Response,
            nextFunction
        );

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
            success: false,
            message: "Invalid or expired token",
        });
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should add user to request and call next if token is valid", async () => {
        mockRequest.headers = { authorization: "Bearer test-token" };

        await authenticateUser(
            mockRequest as AuthRequest,
            mockResponse as Response,
            nextFunction
        );

        expect(mockRequest.user).toEqual({ userId: "test-user-id" });
        expect(nextFunction).toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
    });
});
