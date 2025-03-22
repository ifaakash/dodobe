import mongoose, { Schema } from "mongoose";
import { IPageView, IBlockInteraction } from "../../types/analytics";

const PageViewSchema = new Schema<IPageView>({
    dodoPageId: {
        type: Schema.Types.ObjectId,
        ref: "DodoPage",
        required: true,
    },
    visitorId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    duration: { type: Number }, // in seconds
    referrer: { type: String },
    userAgent: { type: String },
    ipAddress: { type: String },
    country: { type: String },
    device: { type: String },
    browser: { type: String },
    sessionId: { type: String },
});

const BlockInteractionSchema = new Schema<IBlockInteraction>({
    blockId: { type: Schema.Types.ObjectId, ref: "Block", required: true },
    dodoPageId: {
        type: Schema.Types.ObjectId,
        ref: "DodoPage",
        required: true,
    },
    visitorId: { type: String, required: true },
    interactionType: { type: String, required: true }, // click, hover, etc.
    timestamp: { type: Date, default: Date.now },
    sessionId: { type: String },
});

export { PageViewSchema, BlockInteractionSchema };
