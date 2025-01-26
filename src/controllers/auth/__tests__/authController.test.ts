import request from "supertest";
import { app } from "../../../app";
import { UserModel } from "../../../models";
import mongoose from "mongoose";

describe("AuthController", () => {
    describe("POST /api/v1/auth/register", () => {
        it("should register a new user", async () => {
            const response = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    mobileNumber: "+919876543210",
                    otplessId: "test-otpless-id",
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);

            // Verify user was created
            const user = await UserModel.findOne({
                mobileNumber: "+919876543210",
            });
            expect(user).toBeDefined();
            expect(user?.otplessId).toBe("test-otpless-id");
        });
    });

    describe("POST /api/v1/auth/complete-profile", () => {
        it("should complete user profile and create DodoPage", async () => {
            // First register a user
            const registerResponse = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    mobileNumber: "+919876543210",
                    otplessId: "test-otpless-id",
                });

            const userId = registerResponse.body.userId;

            // Complete profile
            const response = await request(app)
                .post("/api/v1/auth/complete-profile")
                .send({
                    userId,
                    name: "Test User",
                    interests: ["coding", "testing"],
                    socialLinks: {
                        twitter: "https://twitter.com/test",
                    },
                });
            console.log("response", response.body);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.dodoPageUrl).toBeDefined();

            // Verify user was updated
            const user = await UserModel.findById(userId).populate("dodoPages");
            expect(user?.name).toBe("Test User");
            expect(user?.dodoPages).toHaveLength(1);
        });
    });

    describe("GET /api/v1/auth/user/:userId", () => {
        it("should get user details with populated dodoPages and interests", async () => {
            // First register and complete profile
            const registerResponse = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    mobileNumber: "+919876543210",
                    otplessId: "test-otpless-id",
                });

            const userId = registerResponse.body.userId;

            // Complete profile
            await request(app)
                .post("/api/v1/auth/complete-profile")
                .send({
                    userId,
                    name: "Test User",
                    interests: ["coding", "testing"],
                    socialLinks: {
                        twitter: "https://twitter.com/test",
                    },
                });

            // Get user details
            const response = await request(app)
                .get(`/api/v1/auth/user/${userId}`)
                .send();

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.user).toBeDefined();
            expect(response.body.user.name).toBe("Test User");
            expect(response.body.user.mobileNumber).toBe("+919876543210");
            expect(response.body.user.otplessId).toBe("test-otpless-id");
            expect(response.body.user.interestCategories).toEqual([
                "coding",
                "testing",
            ]);
            expect(response.body.user.dodoPages).toHaveLength(1);
            expect(response.body.user.dodoPages[0]).toHaveProperty("name");
            expect(response.body.user.dodoPages[0]).toHaveProperty("url");
        });

        it("should return 404 for non-existent user", async () => {
            const nonExistentId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/v1/auth/user/${nonExistentId}`)
                .send();

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                success: false,
                message: "User not found",
            });
        });

        it("should return 400 for invalid userId format", async () => {
            const response = await request(app)
                .get(`/api/v1/auth/user/invalid-id`)
                .send();

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                success: false,
                message: "Invalid user ID format",
            });
        });
    });
});
