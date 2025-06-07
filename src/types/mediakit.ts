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
      follower?: number;
      following?: number;
      mediaCount?: number;
      engagement?: number;
      avgLikes?: number;
      avgComments?: number;
    };
    message?: string;
    error?: string; 
  }
  