export interface VerifyRequestBody {
  instaId: string;
  linkUrl: string;
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
  data?: {
    instaId: string;
    linkUrl: string;
    isVerified: boolean;
    followers?: number;
    following?: number;
    mediaCount?: number;
    engagement?: number;
    avgLikes?: number;
    avgComments?: number;
    brandCollabs?: {
      brandName: string;
      brandLogo: string;
      type: string;
      reach: string;
      engagement: string;
    }[];
  };
  message?: string;
  error?: string;
}

export interface BrandCollabRequestBody {
  instaId: string;
  brandName: string;
  brandLogo: string;
  type: string;
  reach: string;
  engagement: string;
}

export interface BrandCollabResponse {
  success: boolean;
  message: string;
  error?: string;
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
