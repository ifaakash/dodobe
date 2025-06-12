// src/models/mediaKit.model.ts
import mongoose, { Schema, Document } from "mongoose";

interface BrandCollab {
  brandName: string;
  brandLogo: string;
  type: string;
  reach: string;
  engagement: string;
}

interface ContentAnalytics {
    mediaCount: number;
    engagement: number;
    avgLikes: number;
    avgComments: number;
    uploadedAt: Date;
}

interface GenderAnalytics {
    malePercentage: number;
    femalePercentage: number;
    uploadedAt: Date;
}

interface AgeAnalytics {
    "15-24": number;
    "25-34": number;
    "35-44": number;
    "45-54": number;
    uploadedAt: Date;
}

interface LocationAnalytics {
    locations: { [location: string]: number }; // e.g., { "New York": 25, "LA": 30 }
    uploadedAt: Date;
}

export interface IMediaKit extends Document {
    instaId: string;
    linkUrl: string;
    isVerified: boolean;
    followers?: number;
    following?: number;
    mediaCount?: number;
    engagement?: number;
    avgLikes?: number;
    avgComments?: number;
    brandCollabs?: BrandCollab[];
    contentAnalytics?: ContentAnalytics;
    genderAnalytics?: GenderAnalytics;
    ageAnalytics?: AgeAnalytics;
    locationAnalytics?: LocationAnalytics;
}

const BrandCollabSchema = new Schema({
    brandName: { type: String, required: true },
    brandLogo: { type: String, required: true },
    type: { type: String, required: true },
    reach: { type: String, required: true },
    engagement: { type: String, required: true },
});

const MediaKitSchema: Schema = new Schema(
    {
        instaId: { type: String, required: true, unique: true },
        linkUrl: { type: String, required: true },
        isVerified: { type: Boolean, default: false },
        followers: { type: Number, default: 0 },
        following: { type: Number, default: 0 },
        mediaCount: { type: Number, default: 0 },
        engagement: { type: Number, default: 0 },
        avgLikes: { type: Number, default: 0 },
        avgComments: { type: Number, default: 0 },
        brandCollabs: [BrandCollabSchema],
        contentAnalytics: {
            mediaCount: { type: Number },
            engagement: { type: Number },
            avgLikes: { type: Number },
            avgComments: { type: Number },
            uploadedAt: { type: Date },
        },
        genderAnalytics: {
            malePercentage: { type: Number },
            femalePercentage: { type: Number },
            uploadedAt: { type: Date },
        },
        ageAnalytics: {
            "15-24": { type: Number },
            "25-34": { type: Number },
            "35-44": { type: Number },
            "45-54": { type: Number },
            uploadedAt: { type: Date },
        },
        locationAnalytics: {
            locations: { type: Map, of: Number },
            uploadedAt: { type: Date },
        },
    },
    { timestamps: true }
);

export const MediaKitModel = mongoose.model<IMediaKit>("MediaKit", MediaKitSchema);
