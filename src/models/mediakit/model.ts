// src/models/mediaKit.model.ts
import mongoose, { Schema, Document } from "mongoose";

interface BrandCollab {
  brandName: string;
  brandLogo: string;
  type: string;
  reach: string;
  engagement: string;
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
}

const BrandCollabSchema = new Schema({
  brandName: { type: String, required: true },
  brandLogo: { type: String, required: true },
  type: { type: String, required: true },
  reach: { type: String, required: true },
  engagement: { type: String, required: true }
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
    brandCollabs: [BrandCollabSchema]
  },
  { timestamps: true }
);

export const MediaKitModel = mongoose.model<IMediaKit>("MediaKit", MediaKitSchema);
