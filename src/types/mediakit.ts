import { BaseDocument, ID } from "./common";

export interface BrandCollab {
    brandName: string;
    contentType: string;
    contentUrl?: string;
    reach?: string;
    engagement?: string;
    brandLogo?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ContentAnalytics {
    avgLikes: number;
    avgComments: number;
    mediaCount?: number;
    engagement?: number;
    uploadedAt: Date;
}

export interface GenderAnalytics {
    malePercentage: number;
    femalePercentage: number;
    uploadedAt: Date;
    isActive: boolean;
}

export interface AgeAnalytics {
    "15-24": number;
    "25-34": number;
    "35-44": number;
    "45-54": number;
    uploadedAt: Date;
    isActive: boolean;
}

export interface LocationAnalytics {
    locations: Map<string, number>;
    uploadedAt: Date;
    isActive: boolean;
}

export interface IMediaKit extends BaseDocument {
    _id: ID;
    instaId: string;
    followers: number;
    userId?: ID;
    isVerified?: boolean;
    following?: number;
    grade?: string;
    contentAnalytics?: ContentAnalytics;
    genderAnalytics?: GenderAnalytics;
    ageAnalytics?: AgeAnalytics;
    locationAnalytics?: LocationAnalytics;
    brandCollabs?: BrandCollab[];
}

export interface LinkMediaKitRequestBody {
    userId: string;
    instaId: string;
}

export interface LinkMediaKitResponse {
    success: boolean;
    message: string;
    data?: IMediaKit;
    error?: string;
}

export interface CreateMediaKitRequest {
    instaId: string;
    followers: number;
    avgLikes: number;
    avgComments: number;
    mediaCount?: number;
    following?: number;
    grade?: string;
    isVerified?: boolean;
}

export interface CreateMediaKitResponse {
    success: boolean;
    message: string;
    data?: IMediaKit;
    error?: string;
}

export interface VerifyRequestBody {
    instaId: string;
    userId: string;
}

export interface VerifyResponse {
    success: boolean;
    message: string;
    error?: string;
}

export interface CheckVerifiedRequestQuery {
    instaId: string;
}

export interface CheckVerifiedResponse {
    success: boolean;
    isVerified?: boolean;
    message?: string;
    error?: string;
}

export interface MediaKitDetailsResponse {
    success: boolean;
    message?: string;
    error?: string;
    data?: IMediaKit;
}

export interface AddBrandCollabRequestBody {
    instaId: string;
    brandName: string;
    contentType: string;
    contentUrl?: string;
    reach?: string;
    engagement?: string;
    brandLogo?: Express.Multer.File;
}

export interface BrandCollabResponse {
    success: boolean;
    message: string;
    error?: string;
}

export type AllowedMediaKitUpdates = {
    followers?: number;
    following?: number;
    isVerified?: boolean;
    grade?: string;
    brandCollabs?: BrandCollab[];
    contentAnalytics?: ContentAnalytics;
    genderAnalytics?: GenderAnalytics;
    ageAnalytics?: AgeAnalytics;
    locationAnalytics?: LocationAnalytics;
};

export interface UpdateMediaKitRequest {
    instaId: string;
    updates: AllowedMediaKitUpdates;
}

export interface UpdateMediaKitResponse {
    success: boolean;
    message: string;
    error?: string;
    data?: IMediaKit;
}
