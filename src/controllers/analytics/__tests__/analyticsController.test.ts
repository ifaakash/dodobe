import mongoose from "mongoose";
import request from "supertest";
import { app } from "../../../app";
import { DodoPageModel, BlockModel, UserModel } from "../../../models";
import {
    PageViewModel,
    BlockInteractionModel,
} from "../../../models/analytics/model";
import jwt from "jsonwebtoken";
import { config } from "../../../config";
import { ID } from "../../../types/common";
import { BlockType } from "../../../types/block";

describe("Analytics Controller", () => {
    let testDodoPageId: string;
    let testBlockId: string;
    let testUserId: string;
    let authToken: string;

    beforeEach(async () => {
        // Create test user
        const testUser = await UserModel.create({
            mobileNumber: "+1234567890",
            firebaseUid: "test-firebase-uid",
        });
        testUserId = (testUser._id as ID).toString();

        // Create auth token
        authToken = jwt.sign({ userId: testUserId }, config.jwtSecret);

        // Create test DodoPage
        const testDodoPage = await DodoPageModel.create({
            name: "Test Dodo Page",
            url: "test-dodo-page",
            userId: testUserId,
        });
        testDodoPageId = (testDodoPage._id as ID).toString();

        // Create test Block
        const testBlock = await BlockModel.create({
            blockType: BlockType.LINK,
            blockPositionalIndex: 0,
            dodoPageId: testDodoPageId,
            content: {
                url: "https://example.com",
                title: "Example Link",
            },
        });
        testBlockId = (testBlock._id as ID).toString();

        // Update DodoPage with block
        await DodoPageModel.findByIdAndUpdate(testDodoPageId, {
            $push: { blocks: testBlockId },
        });
    });

    afterAll(async () => {
        // Clean up test data
        await UserModel.deleteMany({});
        await DodoPageModel.deleteMany({});
        await BlockModel.deleteMany({});
        await PageViewModel.deleteMany({});
        await BlockInteractionModel.deleteMany({});
    });

    describe("recordPageView", () => {
        it("should record a page view successfully", async () => {
            const visitorId = "test-visitor-" + Date.now();

            const response = await request(app)
                .post("/api/v1/analytics/page-view")
                .send({
                    dodoPageId: testDodoPageId,
                    visitorId,
                    referrer: "https://google.com",
                });

            expect(response.status).toBe(201);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: true,
                    message: "Page view recorded",
                    pageViewId: expect.any(String),
                })
            );

            // Verify data was saved
            const pageViews = await PageViewModel.find({
                dodoPageId: testDodoPageId,
            });
            expect(pageViews.length).toBeGreaterThan(0);

            const savedView = pageViews.find(
                (view) => view.visitorId === visitorId
            );
            expect(savedView).toBeDefined();
            expect(savedView?.referrer).toBe("https://google.com");
        });

        it("should return 404 for non-existent DodoPage", async () => {
            const response = await request(app)
                .post("/api/v1/analytics/page-view")
                .send({
                    dodoPageId: new mongoose.Types.ObjectId().toString(),
                    visitorId: "test-visitor",
                });

            expect(response.status).toBe(404);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: false,
                    message: "DodoPage not found",
                })
            );
        });
    });

    describe("recordBlockInteraction", () => {
        it("should record a block interaction successfully", async () => {
            const visitorId = "test-visitor-" + Date.now();

            const response = await request(app)
                .post("/api/v1/analytics/block-interaction")
                .send({
                    blockId: testBlockId,
                    dodoPageId: testDodoPageId,
                    visitorId,
                    interactionType: "click",
                });

            expect(response.status).toBe(201);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: true,
                    message: "Block interaction recorded",
                    interactionId: expect.any(String),
                })
            );

            // Verify data was saved
            const interactions = await BlockInteractionModel.find({
                blockId: testBlockId,
                visitorId,
            });

            expect(interactions.length).toBe(1);
            expect(interactions[0].interactionType).toBe("click");
        });

        it("should return 404 for non-existent Block", async () => {
            const response = await request(app)
                .post("/api/v1/analytics/block-interaction")
                .send({
                    blockId: new mongoose.Types.ObjectId().toString(),
                    dodoPageId: testDodoPageId,
                    visitorId: "test-visitor",
                    interactionType: "click",
                });

            expect(response.status).toBe(404);
            expect(response.body).toEqual(
                expect.objectContaining({
                    success: false,
                    message: "Block not found",
                })
            );
        });
    });

    describe("recordTimeSpent", () => {
        it("should record time spent on page", async () => {
            const visitorId = "test-visitor-" + Date.now();
            const sessionId = `${visitorId}-${Date.now()}`;

            // First create a page view
            await PageViewModel.create({
                dodoPageId: testDodoPageId,
                visitorId,
                sessionId,
            });

            // Then update with time spent
            const response = await request(app)
                .post("/api/v1/analytics/timeSpent")
                .send({
                    dodoPageId: testDodoPageId,
                    visitorId,
                    timeSpent: 120, // 2 minutes
                    sessionId,
                });

            expect(response.status).toBe(204);

            // Verify data was updated
            const pageView = await PageViewModel.findOne({
                dodoPageId: testDodoPageId,
                visitorId,
                sessionId,
            });

            expect(pageView).toBeDefined();
            expect(pageView?.duration).toBe(120);
        });

        it("should create a new record if no session ID provided", async () => {
            const visitorId = "test-visitor-" + Date.now();

            const response = await request(app)
                .post("/api/v1/analytics/timeSpent")
                .send({
                    dodoPageId: testDodoPageId,
                    visitorId,
                    timeSpent: 60, // 1 minute
                });

            expect(response.status).toBe(204);

            // Verify a new record was created
            const pageViews = await PageViewModel.find({
                dodoPageId: testDodoPageId,
                visitorId,
                duration: 60,
            });

            expect(pageViews.length).toBeGreaterThan(0);
        });
    });

    describe("getDodoPageAnalytics", () => {
        beforeEach(async () => {
            // Clear previous analytics data
            await PageViewModel.deleteMany({ dodoPageId: testDodoPageId });
            await BlockInteractionModel.deleteMany({
                dodoPageId: testDodoPageId,
            });

            // Create test data
            const visitorIds = ["visitor1", "visitor2", "visitor3"];
            const referrers = [
                "google.com",
                "facebook.com",
                "twitter.com",
                "direct",
            ];
            const devices = ["Desktop", "Mobile", "Tablet"];

            // Create page views
            for (let i = 0; i < 10; i++) {
                const visitorId = visitorIds[i % visitorIds.length];
                const referrer = referrers[i % referrers.length];
                const device = devices[i % devices.length];

                // Create with different timestamps
                const date = new Date();
                date.setDate(date.getDate() - (i % 5)); // Spread over 5 days

                await PageViewModel.create({
                    dodoPageId: testDodoPageId,
                    visitorId,
                    referrer,
                    device,
                    timestamp: date,
                    duration: 30 + i * 10, // Different durations
                });
            }

            // Create block interactions
            for (let i = 0; i < 5; i++) {
                const visitorId = visitorIds[i % visitorIds.length];

                await BlockInteractionModel.create({
                    blockId: testBlockId,
                    dodoPageId: testDodoPageId,
                    visitorId,
                    interactionType: "click",
                });
            }
        });

        it("should return analytics data for a DodoPage", async () => {
            const response = await request(app)
                .get(`/api/v1/analytics/dodo-page/${testDodoPageId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({ timeframe: "week" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const { data } = response.body;
            expect(data).toBeDefined();
            expect(data.totalViews).toBe(10);
            expect(data.uniqueVisitors).toBe(3); // From our 3 distinct visitor IDs
            expect(data.averageDuration).toBeGreaterThan(0);
            expect(data.topReferrers.length).toBeGreaterThan(0);
            expect(data.blockInteractions.length).toBe(1); // We only have one block
            expect(data.viewsByDate.length).toBeGreaterThan(0);
            expect(data.deviceBreakdown.length).toBeGreaterThan(0);
        });

        it("should return 404 for non-existent DodoPage", async () => {
            const response = await request(app)
                .get(
                    `/api/v1/analytics/dodo-page/${new mongoose.Types.ObjectId().toString()}`
                )
                .set("Authorization", `Bearer ${authToken}`)
                .send({ timeframe: "week" });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("DodoPage not found");
        });

        it("should require authentication", async () => {
            const response = await request(app)
                .get(`/api/v1/analytics/dodo-page/${testDodoPageId}`)
                .send({ timeframe: "week" });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("No token provided");
        });
    });
});
