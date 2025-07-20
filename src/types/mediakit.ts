import { BaseDocument, ID } from "./common";

export interface BrandCollab {
    _id?: ID;
    brandName: string;
    contentType: string;
    contentUrl?: string;
    reach?: string;
    engagement?: string;
    brandLogo?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ContentAnalytics {
    contentData: {
        posts: number;
        stories: number;
        reels: number;
    };
    uploadedAt: Date;
}

export interface GenderAnalytics {
    genderData: {
        malePercentage: number;
        femalePercentage: number;
    };
    uploadedAt: Date;
    isActive: boolean;
}

export interface AgeAnalytics {
    ageData: {
        ageGroups: Map<string, number> | { [key: string]: number };
    };
    uploadedAt: Date;
    isActive: boolean;
}

export interface LocationAnalytics {
    locationData: {
        locations: Map<string, number> | { [key: string]: number };
    };
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
    avgLikes: number;
    avgComments: number;
    mediaCount: number;
    engagement: number;
    grade?: string;
    queueNumber?: number;
    waitlistCreatedAt?: Date;
    contentAnalytics?: ContentAnalytics;
    genderAnalytics?: GenderAnalytics;
    ageAnalytics?: AgeAnalytics;
    locationAnalytics?: LocationAnalytics;
    mediaKitProfileImage?: string;
    brandCollabs?: {
        isActive: boolean;
        brands: BrandCollab[];
    };
    user?: {
        name: string | null;
        profilePicture: string | null;
        interestCategories: string[];
    };
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
    avgLikes?: number;
    avgComments?: number;
    mediaCount?: number;
    grade?: string;
    brandCollabs?: {
        isActive: boolean;
        brands: BrandCollab[];
    };
    contentAnalytics?: ContentAnalytics;
    genderAnalytics?: GenderAnalytics;
    ageAnalytics?: AgeAnalytics;
    locationAnalytics?: LocationAnalytics;
};

export interface UpdateMediaKitRequest {
    instaId: string;
    updates: AllowedMediaKitUpdates;
    mediaKitProfileImage?: Express.Multer.File;
}

export interface UpdateMediaKitResponse {
    success: boolean;
    message: string;
    error?: string;
    data?: IMediaKit;
}

export type AnalyticsType = "content" | "gender" | "age" | "location";

export interface UploadAnalyticsRequest {
    instaId: string;
    type: AnalyticsType;
    // File will be handled by multer
}

export interface UploadAnalyticsResponse {
    success: boolean;
    data?: MediaKitDetailsResponse["data"]; // Reuse existing type for full mediakit data
    message?: string;
    error?: string;
}

export interface UpdateBrandCollabRequestBody {
    instaId: string;
    brandId: string; // mongoose ID of the specific brand collab
    updates: Partial<BrandCollab>;
}

export interface UpdateBrandCollabResponse {
    success: boolean;
    message: string;
    data?: IMediaKit;
    error?: string;
}

export interface DeleteBrandCollabRequestBody {
    instaId: string;
    brandId: string; // mongoose ID of the specific brand collab
}

export interface DeleteBrandCollabResponse {
    success: boolean;
    message: string;
    data?: IMediaKit;
    error?: string;
}

export interface JoinWaitlistRequestBody {
    instaId: string;
    userId: string;
}

export interface JoinWaitlistResponse {
    success: boolean;
    message: string;
    queueNumber?: number;
    createdAt?: Date;
    error?: string;
}
