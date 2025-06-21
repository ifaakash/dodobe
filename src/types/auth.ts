import { ID } from "./common";
import { SocialLinks } from "./user";
import { TransactionType } from "./dodoCoin";
import { IInvoice, IClientDetail, IRecipientDetail, IBankDetail } from "./invoice";
import { IMediaKit } from "./mediakit";
export interface RegisterRequest {
    mobileNumber: string;
    firebaseUid: string;
    token: string;
}

export interface RegisterResponse {
    success: boolean;
    userId: ID;
    isNewUser: boolean;
    message: string;
    token: string;
}

export interface CompleteProfileRequest {
    userId: ID;
    name: string;
    interests: string[];
    socialLinks: SocialLinks;
}

export interface CompleteProfileResponse {
    success: boolean;
    userId: ID;
    dodoPageId: ID;
    dodoPageUrl: string;
    message: string;
}

export interface GetUserDetailsRequest {
    userId: ID;
}

export interface GetUserDetailsResponse {
    success: boolean;
    user: {
        id: ID;
        firebaseUid: any;
        name: string;
        mobileNumber: string;
        interestCategories: string[];
        dodoPages: {
            id: ID;
            name: string;
            url: string;
            profilePicture?: string;
        }[];
        bankDetails: IBankDetail[];
        invoices: IInvoice[];
        clientDetails: IClientDetail[];
        recipientDetails: IRecipientDetail[];
        dodoCoins: number;
        coinTransactions: {
            id: ID;
            amount: number;
            transactionType: TransactionType;   
            description: string;
            createdAt: Date;
        }[];
        mediaKit: IMediaKit;
    };
}
export interface UpdateUserDetailsResponseError {
    success: false;
    message: string;
}
