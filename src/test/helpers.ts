import { Express } from "express";
import request from "supertest";
import { UserModel, DodoPageModel } from "../models";
import { CreateDodoPageRequest } from "../types/dodoPage";

export const createTestUser = async () => {
    const user = await UserModel.create({
        mobileNumber: "+919876543210",
        firebaseUid: "test-firebaseUid-id",
    });
    return user;
};

export const createTestDodoPage = async (app: Express, userId: string) => {
    const payload: CreateDodoPageRequest = {
        userId: userId as any,
        name: "Test DodoPage",
        socialLinks: {
            linkedin: "https://linkedin.com/test",
        },
    };

    const response = await request(app)
        .post("/api/v1/dodo-pages/create")
        .send(payload);

    return response.body.dodoPage;
};

export const createTestFile = (filename: string, mimeType: string): Buffer => {
    return Buffer.from("test file content");
};

export const attachTestFiles = (request: request.Test) => {
    const imageBuffer = createTestFile("test-image.jpg", "image/jpeg");
    const audioBuffer = createTestFile("test-audio.mp3", "audio/mpeg");

    return request
        .attach("profilePicture", imageBuffer, {
            filename: "test-image.jpg",
            contentType: "image/jpeg",
        })
        .attach("audioBio", audioBuffer, {
            filename: "test-audio.mp3",
            contentType: "audio/mpeg",
        });
};
