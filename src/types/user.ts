import { BaseDocument, ID } from "./common";

export enum SocialPlatform {
    LINKEDIN = "linkedin",
    INSTAGRAM = "instagram",
    FACEBOOK = "facebook",
    YOUTUBE = "youtube",
    TWITTER = "twitter",
    GITHUB = "github",
}

export type SocialLinks = Partial<Record<SocialPlatform, string>>;

export interface IUser extends BaseDocument {
    name: string;
    mobileNumber: string;
    otplessId?: string;
    dodoPages: ID[];
    interestCategories: ID[];
    bankDetails: ID[];
    invoices: ID[];
    clientDetails: ID[];
    recipientDetails: ID[];
}

export interface IUserInterestCategory extends BaseDocument {
    userId: ID;
    category: string;
}

export interface IDodoPage extends BaseDocument {
    userId: ID;
    name: string;
    url: string;
    profilePicture?: string;
    socialLinks: Record<SocialPlatform, string>;
    thoughts?: string;
    audioBio?: string;
    blocks: ID[];
}
