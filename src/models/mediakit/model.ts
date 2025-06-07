// src/models/mediaKit.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IMediaKit extends Document {
  instaId: string;
  linkUrl: string;
  isVerified: boolean;
  follower?: number;
  following?: number;
  mediaCount?: number;
  engagement?: number;
  avgLikes?: number;
  avgComments?: number;
}

const MediaKitSchema: Schema = new Schema(
  {
    instaId: { type: String, required: true, unique: true },
    linkUrl: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    follower: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    mediaCount: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    avgLikes: { type: Number, default: 0 },
    avgComments: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const MediaKitModel = mongoose.model<IMediaKit>("MediaKit", MediaKitSchema);
