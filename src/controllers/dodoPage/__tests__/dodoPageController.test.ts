import request from "supertest";
import { app } from "../../../app";
import { DodoPageModel } from "../../../models";
import mongoose, { Types } from "mongoose";
import path from "path";
import { FileManager } from "../../../utils/fileManager";
import { createTestUser, attachTestFiles } from "../../../test/helpers";
import { ID } from "@/types/common";

describe("DodoPageController", () => {
    let userId: Types.ObjectId;
    let dodoPageId: Types.ObjectId;
    const testFilesPath = path.join(__dirname, "../../../test/fixtures");

    beforeEach(async () => {
        const user = await createTestUser();
        userId = user._id as ID;

        // Create a test DodoPage for update/delete tests
        const dodoPage = await DodoPageModel.create({
            userId: user._id,
            name: "Test DodoPage",
            url: "test-dodopage",
            socialLinks: { twitter: "https://twitter.com/test" },
            thoughts: "Test thoughts",
        });
        dodoPageId = dodoPage._id as ID;
    });

    describe("POST /api/v1/dodo-page/create", () => {
        it("should create a new dodo page with files", async () => {
            const req = request(app)
                .post("/api/v1/dodo-page/create")
                .field("userId", userId.toString())
                .field("name", "Test DodoPage")
                .field("socialLinks[twitter]", "https://twitter.com/test")
                .field("thoughts", "Test thoughts");

            // Attach test files
            attachTestFiles(req);

            const response = await req;

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.dodoPage).toBeDefined();
            expect(response.body.dodoPage.name).toBe("Test DodoPage");
            expect(response.body.dodoPage.profilePicture).toBeDefined();
            expect(response.body.dodoPage.audioBio).toBeDefined();
            expect(response.body.dodoPage.socialLinks).toHaveProperty(
                "twitter"
            );
        });

        it("should return 404 for non-existent user", async () => {
            const response = await request(app)
                .post("/api/v1/dodo-page/create")
                .field("userId", new Types.ObjectId().toString())
                .field("name", "Test DodoPage");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe("GET /api/v1/dodo-page/get-by-url/:url", () => {
        it("should retrieve a dodo page by custom URL", async () => {
            const dodoPage = await DodoPageModel.create({
                userId,
                name: "Test DodoPage",
                url: "test-dodo-page",
                socialLinks: { twitter: "https://twitter.com/test" },
            });

            const response = await request(app).get(
                `/api/v1/dodo-page/get-by-url/${dodoPage.url}`
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.dodoPage.name).toBe("Test DodoPage");
        });

        it("should return 404 for non-existent URL", async () => {
            const response = await request(app).get(
                "/api/v1/dodo-page/get-by-url/non-existent-url"
            );

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("DodoPage not found");
        });
    });

    // to be fixed
    describe("PATCH /api/v1/dodo-page/update/:id", () => {
        it("should update a dodo page", async () => {
            const response = await request(app)
                .patch(`/api/v1/dodo-page/update/${dodoPageId}`)
                .field("name", "Updated Name")
                .field("socialLinks[twitter]", "https://twitter.com/test")
                .field("thoughts", "Updated thoughts");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.dodoPage.name).toBe("Updated Name");
            expect(response.body.dodoPage.socialLinks.twitter).toBe(
                "https://twitter.com/test"
            );
        });

        it("should return 404 for non-existent page", async () => {
            const response = await request(app)
                .patch(`/api/v1/dodo-page/update/${new Types.ObjectId()}`)
                .field("name", "Updated Name");

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe("DELETE /api/v1/dodo-page/delete/:pageId", () => {
        it("should delete a dodo page and clean up files", async () => {
            const dodoPage = await DodoPageModel.create({
                userId,
                name: "Test DodoPage",
                url: "test-dodo-page",
                profilePicture: "test-profile-picture.jpg",
                audioBio: "test-audio-bio.mp3",
            });

            jest.spyOn(FileManager, "fileExists").mockResolvedValue(true);
            jest.spyOn(FileManager, "deleteFile").mockResolvedValue(
                Promise.resolve()
            );

            const response = await request(app).delete(
                `/api/v1/dodo-page/delete/${dodoPage._id}`
            );

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            const deletedPage = await DodoPageModel.findById(dodoPage._id);
            expect(deletedPage).toBeNull();
        });
    });

    beforeAll(async () => {
        // Create test files if they don't exist
        const testImagePath = path.join(testFilesPath, "test-image.jpg");
        const testAudioPath = path.join(testFilesPath, "test-audio.mp3");

        // Ensure directory exists
        await FileManager.ensureDirectoryExists(testFilesPath);

        // Create test files if they don't exist
        if (!(await FileManager.fileExists(testImagePath))) {
            await FileManager.createEmptyFile(testImagePath);
        }
        if (!(await FileManager.fileExists(testAudioPath))) {
            await FileManager.createEmptyFile(testAudioPath);
        }
    });

    afterEach(async () => {
        await DodoPageModel.deleteMany({});
        jest.restoreAllMocks();
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });
});
