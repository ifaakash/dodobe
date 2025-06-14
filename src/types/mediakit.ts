import { BaseDocument, ID } from "./common";

export interface BrandCollab extends BaseDocument {
    _id: ID;
    brandName: string;
    contentType: string;
    contentUrl?: string;
    reach?: string;
    engagement?: string;
}

export interface IMediaKit extends BaseDocument {
    _id: ID;
    userId: ID;
    instaId: string;
    isVerified: boolean;
    followers?: number;
    following?: number;
    mediaCount?: number;
    engagement?: number;
    avgLikes?: number;
    avgComments?: number;
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
    engagement?: number;
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

export interface UpdateMediaKitRequest {
    instaId: string;
    updates: {
        followers?: number;
        following?: number;
        mediaCount?: number;
        engagement?: number;
        avgLikes?: number;
        avgComments?: number;
        brandCollab?: BrandCollab;
    };
}

export interface UpdateMediaKitResponse {
    success: boolean;
    message: string;
    error?: string;
}
