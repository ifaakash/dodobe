import { ID } from "./common";
import { SocialLinks } from "./user";

export interface CreateDodoPageRequest {
    userId: ID;
    name: string;
    socialLinks?: SocialLinks;
    thoughts?: string;
    audioBio?: string;
}

export interface UpdateDodoPageRequest {
    id: ID;
    userId: ID;
    name?: string;
    socialLinks?: SocialLinks;
    thoughts?: string;
    audioBio?: string;
    profilePicture?: string;
}

export interface DodoPageResponse {
    success: boolean;
    dodoPage: {
        id: ID;
        name: string;
        url: string;
        profilePicture?: string;
        socialLinks: SocialLinks;
        thoughts?: string;
        audioBio?: string;
        blocks: ID[];
    };
    message: string;
}

export interface DodoPagesListResponse {
    success: boolean;
    dodoPages: Array<{
        id: ID;
        name: string;
        url: string;
        profilePicture?: string;
    }>;
}
