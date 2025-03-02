import request from "supertest";
import { app } from "../../app";

describe("Protected Routes", () => {
    // Set NODE_ENV to test for our tests
    beforeAll(() => {
        process.env.NODE_ENV = "test";
    });

    describe("GET /api/v1/dodo-page", () => {
        it("should return 401 if no token is provided", async () => {
            const response = await request(app).get("/api/v1/dodo-page");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it("should return 401 if invalid token is provided", async () => {
            const response = await request(app)
                .get("/api/v1/dodo-page")
                .set("Authorization", "Bearer invalid.token");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it("should allow access with valid test token", async () => {
            const response = await request(app)
                .get("/api/v1/dodo-page")
                .set("Authorization", "Bearer test-token");

            // This assumes the route handler would return a 200 if authentication passes
            // The actual status code depends on your implementation
            expect(response.status).not.toBe(401);
        });
    });

    // You can add similar tests for other protected routes
});
