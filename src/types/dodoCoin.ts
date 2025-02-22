import { ID, BaseDocument } from "./common";

export enum TransactionType {
    EARNED = "EARNED",
    SPENT = "SPENT",
    REDEEMED = "REDEEMED",
}

export enum CoinMilestoneType {
    CREATE_INVOICE = "CREATE_INVOICE",
    PAGE_VIEWS = "PAGE_VIEWS",
    CREATE_DODO_PAGE = "CREATE_DODO_PAGE",
    CREATE_BLOCK = "CREATE_BLOCK",
    // Add more milestone types as needed
}

export interface ICoinTransaction extends BaseDocument {
    userId: ID;
    amount: number;
    transactionType: TransactionType;
    description: string;
    milestoneType?: CoinMilestoneType;
    metadata?: Record<string, any>; // For storing additional context
}

export interface ICoinMilestone extends BaseDocument {
    type: CoinMilestoneType;
    coinReward: number;
    isActive: boolean;
    conditions: {
        threshold: number; // e.g., number of views needed
        frequency?: string; // e.g., 'once', 'daily', 'weekly'
    };
}

export interface IRedeemableItem extends BaseDocument {
    name: string;
    description: string;
    coinCost: number;
    isActive: boolean;
    type: string; // e.g., 'theme', 'feature', 'service'
    metadata?: Record<string, any>; // Additional item details
}

// API Request/Response types
export interface UpdateCoinsRequest {
    userId: ID;
    amount: number;
    transactionType: TransactionType;
    description: string;
    milestoneType?: CoinMilestoneType;
    metadata?: Record<string, any>;
}

export interface UpdateCoinsResponse {
    success: boolean;
    data: {
        newBalance: number;
        transaction: ICoinTransaction;
    };
}

export interface UpdateCoinsResponseError {
    success: boolean;
    msg: string;
}

export interface GetUserCoinsResponse {
    success: boolean;
    data: {
        currentBalance: number;
        transactions: ICoinTransaction[];
    };
    msg: string;
}

export interface RedeemCoinsRequest {
    userId: ID;
    itemId: ID;
}

export interface RedeemCoinsResponse {
    success: boolean;
    data: {
        remainingBalance: number;
        redeemedItem: IRedeemableItem;
    };
    msg: string;
}

export interface RedeemCoinsResponseError {
    success: boolean;
    msg: string;
}

export interface BulkUpdateCoinsRequest {
    userIds: ID[];
    amount: number;
    transactionType: TransactionType;
    description: string;
    milestoneType?: CoinMilestoneType;
}
