"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestDodoPage = exports.createTestUser = void 0;
const supertest_1 = __importDefault(require("supertest"));
const models_1 = require("../models");
const createTestUser = async () => {
    const user = await models_1.UserModel.create({
        mobileNumber: "+919876543210",
        otplessId: "test-otpless-id",
    });
    return user;
};
exports.createTestUser = createTestUser;
const createTestDodoPage = async (app, userId) => {
    const payload = {
        userId: userId,
        name: "Test DodoPage",
        socialLinks: {
            linkedin: "https://linkedin.com/test",
        },
    };
    const response = await (0, supertest_1.default)(app)
        .post("/api/v1/dodo-pages/create")
        .send(payload);
    return response.body.dodoPage;
};
exports.createTestDodoPage = createTestDodoPage;
