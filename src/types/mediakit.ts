import { BaseDocument, ID } from "./common";

export interface BrandCollab extends BaseDocument {
    _id: ID;
    brandName: string;
    contentType: string;
    contentUrl?: string;
    reach?: string;
    engagement?: string;
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
}

export interface AgeAnalytics {
    "15-24": number;
    "25-34": number;
    "35-44": number;
    "45-54": number;
    uploadedAt: Date;
}

export interface LocationAnalytics {
    locations: Map<string, number>;
    uploadedAt: Date;
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
    brandCollab: BrandCollab;
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
