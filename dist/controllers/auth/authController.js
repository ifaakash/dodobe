"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const models_1 = require("../../models");
const logger_1 = require("../../utils/logger");
const mongoose_1 = __importDefault(require("mongoose"));
const mongoose_2 = require("mongoose");
const fileManager_1 = require("../../utils/fileManager");
class AuthController {
    /**
     * Register user after OTPless login
     */
    static async registerUser(req, res) {
        const { mobileNumber, otplessId, token } = req.body;
        try {
            // Check if user already exists with otplessId
            const existingUser = await models_1.UserModel.findOne({ otplessId });
            if (existingUser) {
                res.status(200).json({
                    success: true,
                    message: "User already exists",
                    userId: existingUser._id,
                    isNewUser: false,
                    token
                });
                return;
            }
            // Create new user if doesn't exist
            const newUser = await models_1.UserModel.create({
                mobileNumber,
                otplessId,
            });
            res.status(201).json({
                success: true,
                message: "User registered successfully",
                userId: newUser._id,
                isNewUser: true,
                token: token,
            });
        }
        catch (error) {
            logger_1.logger.error("Error in registerUser:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                userId: new mongoose_2.Types.ObjectId(),
                isNewUser: false,
                token: ''
            });
        }
    }
    /**
     * Complete user profile and create default DodoPage
     */
    static async completeProfile(req, res) {
        const { userId, name, interests, socialLinks } = req.body;
        try {
            const user = await models_1.UserModel.findById(userId);
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }
            user.name = name;
            const interestCategories = (await Promise.all(interests.map((category) => models_1.UserInterestCategoryModel.create({
                userId,
                category,
            }))));
            user.interestCategories = interestCategories.map((ic) => ic._id);
            // Generate unique URL for DodoPage
            const generateUniqueUrl = async (baseName) => {
                const randomId = Math.random()
                    .toString(36)
                    .substring(2, 8);
                const url = `${baseName
                    .toLowerCase()
                    .replace(/\s+/g, "-")}-${randomId}`;
                const existingPage = await models_1.DodoPageModel.findOne({ url });
                if (existingPage) {
                    return generateUniqueUrl(baseName);
                }
                return url;
            };
            // Create default DodoPage for the first time user
            const dodoPage = (await models_1.DodoPageModel.create({
                userId,
                name,
                url: await generateUniqueUrl(name),
                socialLinks,
            }));
            user.dodoPages = [dodoPage._id];
            await user.save();
            res.status(200).json({
                success: true,
                userId: user._id,
                dodoPageId: dodoPage._id,
                dodoPageUrl: dodoPage.url,
                message: "Profile completed and DodoPage created successfully",
            });
        }
        catch (error) {
            logger_1.logger.error("Error in completeProfile:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }
    static async getUserDetails(req, res) {
        const { userId } = req.params;
        try {
            // Validate if userId is a valid ObjectId
            if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid user ID format",
                });
                return;
            }
            const user = await models_1.UserModel.findById(userId)
                .populate({
                path: "dodoPages",
                select: "_id name url profilePicture",
            })
                .populate({
                path: "interestCategories",
                select: "category",
            });
            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }
            res.status(200).json({
                success: true,
                user: {
                    id: user._id,
                    otplessId: user.otplessId,
                    name: user.name,
                    mobileNumber: user.mobileNumber,
                    interestCategories: user.interestCategories.map((ic) => ic.category),
                    dodoPages: user.dodoPages.map((page) => ({
                        id: page._id,
                        name: page.name,
                        url: page.url,
                        profilePicture: page.profilePicture
                            ? fileManager_1.FileManager.getFileUrl(page.profilePicture)
                            : "",
                    })),
                    bankDetails: user.bankDetails,
                    invoices: user.invoices,
                    clientDetails: user.clientDetails,
                    recipientDetails: user.recipientDetails,
                },
            });
        }
        catch (error) {
            logger_1.logger.error("Error in getUserDetails:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
}
exports.AuthController = AuthController;
