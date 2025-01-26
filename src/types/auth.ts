import { ID } from "./common";
import { IDodoPage, IUser, SocialLinks } from "./user";

export interface RegisterRequest {
    mobileNumber: string;
    otplessId: string;
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
        otplessId: any; //any because we dont know the type of otplessId yet
        name: string;
        mobileNumber: string;
        interestCategories: string[];
        dodoPages: {
            id: ID;
            name: string;
            url: string;
            profilePicture?: string;
        }[];
        bankDetails: ID[];
        invoices: ID[];
        clientDetails: ID[];
        recipientDetails: ID[];
    };
}
export interface UpdateUserDetailsResponseError {
    success: false;
    message: string;
}
