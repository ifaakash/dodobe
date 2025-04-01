export interface ContentGenerationRequest {
    prompt: string;
    category: string;
    additionalDetails?: {
        tone?: string;
        targetAudience?: string;
        length?: string;
        [key: string]: any;
    };
}

export interface ContentGenerationResponse {
    content: string;
    error?: string;
}

export interface ContentGenerationResponseError {
    success: false;
    message: string;
    error: string;
}
