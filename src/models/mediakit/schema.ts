import { Schema } from "mongoose";

const BrandCollabSchema = new Schema({
    brandName: { type: String, required: true },
    brandLogo: { type: String, required: false },
    contentType: { type: String, required: true },
    contentUrl: { type: String, required: false },
    reach: { type: String, required: false },
    engagement: { type: String, required: false },
});

const MediaKitSchema: Schema = new Schema(
    {
        instaId: { type: String, required: true, unique: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
        isVerified: { type: Boolean, default: false },
        followers: { type: Number, default: 0 },
        following: { type: Number, default: 0 },
        mediaCount: { type: Number, default: 0 },
        engagement: { type: Number, default: 0 },
        avgLikes: { type: Number, default: 0 },
        avgComments: { type: Number, default: 0 },
        brandCollabs: [BrandCollabSchema],
    },
    { timestamps: true }
);

export { MediaKitSchema, BrandCollabSchema };
