"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dodoPageSchema = exports.userInterestCategorySchema = exports.userSchema = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    name: { type: String },
    mobileNumber: { type: String, required: true },
    firebaseUid: { type: String, unique: true, sparse: true },
    dodoPages: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "DodoPage" }],
    interestCategories: [
        { type: mongoose_1.Schema.Types.ObjectId, ref: "UserInterestCategory" },
    ],
    bankDetails: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "BankDetail" }],
    invoices: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Invoice" }],
    clientDetails: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "ClientDetail" }],
    recipientDetails: [
        { type: mongoose_1.Schema.Types.ObjectId, ref: "RecipientDetail" },
    ],
    dodoCoins: {
        type: Number,
        default: 0,
        min: 0,
    },
    coinTransactions: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "CoinTransaction",
            default: [],
        },
    ],
}, {
    timestamps: true,
});
exports.userSchema = userSchema;
const userInterestCategorySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true },
}, {
    timestamps: true,
});
exports.userInterestCategorySchema = userInterestCategorySchema;
const dodoPageSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    profilePicture: String,
    socialLinks: {
        type: Map,
        of: String,
        default: {},
    },
    thoughts: String,
    audioBio: String,
    blocks: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Block" }],
}, {
    timestamps: true,
});
exports.dodoPageSchema = dodoPageSchema;
