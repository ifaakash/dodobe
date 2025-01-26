import { Express } from "express";
import request from "supertest";
import { UserModel, DodoPageModel } from "../models";
import { CreateDodoPageRequest } from "../types/dodoPage";

export const createTestUser = async () => {
    const user = await UserModel.create({
        mobileNumber: "+919876543210",
        otplessId: "test-otpless-id",
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
