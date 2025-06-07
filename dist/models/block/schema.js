"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.separatorBlockSchema = exports.headingBlockSchema = exports.productBlockSchema = exports.pollBlockSchema = exports.linkBlockSchema = exports.badgeSchema = exports.blockSchema = void 0;
const mongoose_1 = require("mongoose");
const block_1 = require("../../types/block");
const blockSchema = new mongoose_1.Schema({
    dodoPageId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "DodoPage",
        required: true,
    },
    blockType: {
        type: String,
        enum: Object.values(block_1.BlockType),
        required: true,
    },
    blockPositionalIndex: { type: Number, required: true },
    blockCardSize: {
        type: String,
        enum: Object.values(block_1.BlockCardSize),
        required: true,
        default: block_1.BlockCardSize.NA,
    },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});
exports.blockSchema = blockSchema;
const badgeSchema = new mongoose_1.Schema({
    text: { type: String, required: true },
    color: { type: String, required: true },
    backgroundColor: { type: String, required: true },
}, {
    timestamps: true,
});
exports.badgeSchema = badgeSchema;
const linkBlockSchema = new mongoose_1.Schema({
    blockId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Block", required: true },
    title: { type: String, required: true },
    linkDisplayPicture: String,
    url: { type: String, required: true },
    badge: { type: mongoose_1.Schema.Types.ObjectId, ref: "Badge" },
    blockCardSize: { type: String, required: true },
}, {
    timestamps: true,
});
exports.linkBlockSchema = linkBlockSchema;
const pollBlockSchema = new mongoose_1.Schema({
    blockId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Block", required: true },
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    isMultipleOptionsAllowed: { type: Boolean, default: false },
    optionCounts: { type: Object, required: true, default: {} },
}, {
    timestamps: true,
});
exports.pollBlockSchema = pollBlockSchema;
const productBlockSchema = new mongoose_1.Schema({
    blockId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Block", required: true },
    productImage: String,
    title: { type: String, required: true },
    link: { type: String, required: true },
}, {
    timestamps: true,
});
exports.productBlockSchema = productBlockSchema;
const headingBlockSchema = new mongoose_1.Schema({
    blockId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Block", required: true },
    title: { type: String, required: true },
}, {
    timestamps: true,
});
exports.headingBlockSchema = headingBlockSchema;
const separatorBlockSchema = new mongoose_1.Schema({
    blockId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Block", required: true },
    separatorType: { type: String, required: true },
}, {
    timestamps: true,
});
exports.separatorBlockSchema = separatorBlockSchema;
