"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const models_1 = require("../../models");
const logger_1 = require("../../utils/logger");
const mongoose_1 = __importStar(require("mongoose"));
const fileManager_1 = require("../../utils/fileManager");
const dodoCoin_1 = require("../../types/dodoCoin");
const jwt_1 = require("../../utils/jwt");
class AuthController {
    /**
     * Register user after Firebase login
     */
    static async registerUser(req, res) {
        const { mobileNumber, firebaseUid } = req.body;
        try {
            // Check if user already exists with firebaseUid
            const existingUser = await models_1.UserModel.findOne({ firebaseUid });
            if (existingUser) {
                const token = (0, jwt_1.generateToken)(existingUser._id.toString() || "");
                res.status(200).json({
                    success: true,
                    message: "User already exists",
                    userId: existingUser._id,
                    isNewUser: false,
                    token,
                });
                return;
            }
            // Create new user if doesn't exist
            const newUser = await models_1.UserModel.create({
                mobileNumber,
                firebaseUid,
            });
            const transaction = await models_1.CoinTransactionModel.create({
                userId: newUser._id,
                amount: 200,
                transactionType: dodoCoin_1.TransactionType.EARNED,
                description: 'Dodo page created',
                milestoneType: dodoCoin_1.CoinMilestoneType.CREATE_DODO_PAGE,
            });
            // Update user's dodoCoins
            newUser.dodoCoins = (newUser.dodoCoins || 0) + transaction.amount;
            await newUser.save();
            const token = (0, jwt_1.generateToken)(newUser._id.toString() || "");
            res.status(201).json({
                success: true,
                message: "User registered successfully",
                userId: newUser._id,
                isNewUser: true,
                token,
            });
        }
        catch (error) {
            logger_1.logger.error("Error in registerUser:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
                userId: new mongoose_1.Types.ObjectId(),
                isNewUser: false,
                token: "",
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
            })
                .populate({
                path: "coinTransactions",
                select: "_id amount transactionType description createdAt",
            }).populate({
                path: "bankDetails",
            }).populate({
                path: "invoices",
            }).populate({
                path: "clientDetails",
            }).populate({
                path: "recipientDetails",
            });
            const bankDetails = await models_1.BankDetailModel.find({ userId });
            const invoices = await models_1.InvoiceModel.find({ userId });
            const clientDetails = await models_1.ClientDetailModel.find({ userId });
            const recipientDetails = await models_1.RecipientDetailModel.find({
                userId,
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
                    firebaseUid: user.firebaseUid,
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
                    bankDetails: bankDetails,
                    invoices: invoices,
                    clientDetails: clientDetails,
                    recipientDetails: recipientDetails,
                    dodoCoins: user.dodoCoins || 0,
                    coinTransactions: user.coinTransactions.map((tx) => ({
                        id: tx._id,
                        amount: tx.amount,
                        transactionType: tx.transactionType,
                        description: tx.description,
                        createdAt: tx.createdAt,
                    })),
                },
            });
        }
        catch (error) {
            logger_1.logger.error("Error in getUserDetails:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }
}
exports.AuthController = AuthController;
