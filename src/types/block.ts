import { BaseDocument, ID } from "./common";
import { Types } from "mongoose";

export enum BlockType {
    LINK = "LINK",
    POLL = "POLL",
    PRODUCT = "PRODUCT",
    SEPARATOR = "SEPARATOR",
    HEADING = "HEADING",
}

export enum SeparatorType {
    DASHED_LINE = "dashed-line",
    SOLID_LINE = "solid-line",
    OR = "or",
}

export enum BlockCardSize {
    NA = "NA",
    SMALL = "SMALL",
    MEDIUM = "MEDIUM",
    LARGE = "LARGE",
}

export interface IBlock extends BaseDocument {
    dodoPageId: ID;
    blockType: BlockType;
    blockPositionalIndex: number;
    blockCardSize: BlockCardSize;
    isActive: boolean;
}

export interface ILinkBlock extends BaseDocument {
    blockId: ID;
    title: string;
    linkDisplayPicture?: string;
    url: string;
    badge?: ID;
    blockCardSize: BlockCardSize;
}

export interface IBadge extends BaseDocument {
    text: string;
    color: string;
    backgroundColor: string;
    backgroundColor: string;
}

export interface IPollBlock extends BaseDocument {
    blockId: ID;
    question: string;
    options: string[];
    isMultipleOptionsAllowed: boolean;
    optionCounts: { [key: string]: number };
}

export interface IProductBlock extends BaseDocument {
    blockId: ID;
    productImage: string;
    title: string;
    link: string;
}

export interface IHeadingBlock extends BaseDocument {
    blockId: ID;
    title: string;
}

export interface ISeparatorBlock extends BaseDocument {
    blockId: ID;
    separatorType: SeparatorType;
}

export interface Badge {
    text: string;
    backgroundColor: string;
    color: string;
}

export type BlockData =
    | LinkBlockData
    | PollBlockData
    | ProductBlockData
    | HeadingBlockData;

export interface CreateBlockRequest {
    dodoPageId: string;
    blockType: BlockType;
    blockCardSize: BlockCardSize;
    blockData: BlockData;
    userId: string;
}

export interface UpdateBlockRequest {
    blockId: string;
    userId: string;
    blockId: string;
    userId: string;
    blockData?: Partial<BlockData>;
    blockPositionalIndex?: number;
    blockCardSize?: BlockCardSize;
    isActive?: boolean;
    dodopageUrl?: string;
}

export interface ReorderBlocksRequest {
    dodoPageId: string;
    blocks: Array<{
        blockId: string;
        newIndex: number;
    }>;
}

export interface LinkBlockData {
    title: string;
    url: string;
    description?: string;
    linkDisplayPicture?: string;
    badge?: Badge;
}

export interface PollBlockData {
    question: string;
    options: string[];
}

export interface ProductBlockData {
    title: string;
    description?: string;
    price: number;
    productImage?: string;
    badge?: Badge;
}

export interface HeadingBlockData {
    title: string;
}

// Response Types
export interface BlockResponse {
    success: boolean;
    block: {
        id: ID;
        blockType: BlockType;
        blockCardSize: BlockCardSize;
        blockPositionalIndex: number;
        isActive: boolean;
        blockData: any;
    };
    message: string;
}

export interface BlocksListResponse {
    success: boolean;
    blocks: Array<{
        id: ID;
        blockType: BlockType;
        blockCardSize: BlockCardSize;
        blockPositionalIndex: number;
        isActive: boolean;
        blockData: any;
    }>;
}
