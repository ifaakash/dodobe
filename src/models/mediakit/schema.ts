import { Schema } from "mongoose";

const BrandCollabSchema = new Schema(
    {
        brandName: { type: String, required: true },
        brandLogo: { type: String, required: false },
        contentType: { type: String, required: true },
        contentUrl: { type: String, required: false },
        reach: { type: String, required: false },
        engagement: { type: String, required: false },
    },
    { timestamps: true }
);

const ContentAnalyticsSchema = new Schema(
    {
        mediaCount: { type: Number, min: 0 },
        avgLikes: { type: Number, min: 0 },
        avgComments: { type: Number, min: 0 },
    },
    { _id: false }
);

const GenderAnalyticsSchema = new Schema(
    {
        malePercentage: { type: Number, min: 0, max: 100 },
        femalePercentage: { type: Number, min: 0, max: 100 },
    },
    { _id: false }
);

const AgeAnalyticsSchema = new Schema(
    {
        "15-24": { type: Number, min: 0 },
        "25-34": { type: Number, min: 0 },
        "35-44": { type: Number, min: 0 },
        "45-54": { type: Number, min: 0 },
    },
    { _id: false }
);

const LocationAnalyticsSchema = new Schema(
    {
        locations: { type: Map, of: { type: Number, min: 0 } },
    },
    { _id: false }
);

const MediaKitSchema: Schema = new Schema(
    {
        instaId: { type: String, required: true, unique: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
        isVerified: { type: Boolean, default: false },
        followers: { type: Number, min: 0 },
        following: { type: Number, min: 0 },
        grade: { type: String, required: false },
        brandCollabs: {
            isActive: { type: Boolean, default: true },
            brands: { type: [BrandCollabSchema], default: [] }
        },
        contentAnalytics: {
            contentData: { type: ContentAnalyticsSchema },
            uploadedAt: { type: Date },
        },
        genderAnalytics: {
            isActive: { type: Boolean, default: true },
            genderData: { type: GenderAnalyticsSchema, },
            uploadedAt: { type: Date },
        },
        ageAnalytics: {
            isActive: { type: Boolean, default: true },
            ageData: { type: AgeAnalyticsSchema },
            uploadedAt: { type: Date },
        },
        engagement: { type: Number, min: 0 },
        locationAnalytics: {
            isActive: { type: Boolean, default: true },
            locationData: { type: LocationAnalyticsSchema },
            uploadedAt: { type: Date },
        },
        rateCard: {
            isActive: { type: Boolean, default: true },
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Add validation to ensure gender percentages sum to 100
// MediaKitSchema.path("genderAnalytics").validate(function (value: any) {
//     if (!value) return true;
//     return value.malePercentage + value.femalePercentage === 100;
// }, "Gender percentages must sum to 100");

export {
    MediaKitSchema,
    BrandCollabSchema,
    ContentAnalyticsSchema,
    GenderAnalyticsSchema,
    AgeAnalyticsSchema,
    LocationAnalyticsSchema,
};
