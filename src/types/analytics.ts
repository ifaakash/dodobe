import { ID } from "./common";

export interface IPageView {
    _id?: ID;
    dodoPageId: ID;
    visitorId: string;
    timestamp: Date;
    duration?: number;
    referrer?: string;
    userAgent?: string;
    ipAddress?: string;
    country?: string;
    device?: string;
    browser?: string;
    sessionId?: string;
}

export interface IBlockInteraction {
    _id?: ID;
    blockId: ID;
    dodoPageId: ID;
    visitorId: string;
    interactionType: string;
    timestamp: Date;
    sessionId?: string;
}

export interface AnalyticsSummary {
    totalViews: number;
    uniqueVisitors: number;
    averageDuration: number;
    totalClicks: number;
    topReferrers: {
        source: string;
        count: number;
    }[];
    blockInteractions: {
        blockId: ID;
        blockType: string;
        interactionCount: number;
    }[];
    viewsByDate: {
        date: string;
        count: number;
    }[];
    deviceBreakdown: {
        device: string;
        percentage: number;
    }[];
}

// Request and Response types

// Page View
export interface RecordPageViewRequest {
    dodoPageId: string;
    visitorId: string;
    referrer?: string;
    sessionId?: string;
}

export interface RecordPageViewResponse {
    success: boolean;
    message: string;
    pageViewId?: ID;
}

// Block Interaction
export interface RecordBlockInteractionRequest {
    blockId: string;
    dodoPageId: string;
    visitorId: string;
    interactionType: string;
    sessionId?: string;
}

export interface RecordBlockInteractionResponse {
    success: boolean;
    message: string;
    interactionId?: ID;
}

// Time Spent
export interface RecordTimeSpentRequest {
    dodoPageId: string;
    visitorId: string;
    timeSpent: number;
    sessionId?: string;
}

// No response type needed for Beacon API as it doesn't process responses

// Get Analytics
export interface GetDodoPageAnalyticsRequest {
    timeframe?: "day" | "week" | "month" | "overall";
}

export interface GetDodoPageAnalyticsResponse {
    success: boolean;
    data?: {
        totalViews: number;
        uniqueVisitors: number;
        averageDuration: number;
        totalClicks: number;
        topReferrers: {
            source: string;
            count: number;
        }[];
        blockInteractions: {
            blockId: string;
            blockType: string;
            interactionCount: number;
        }[];
        viewsByDate: {
            date: string;
            count: number;
        }[];
        deviceBreakdown: {
            device: string;
            percentage: number;
        }[];
    };
    message?: string;
}
