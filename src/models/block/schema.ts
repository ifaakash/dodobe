import { Schema } from "mongoose";
import {
    IBlock,
    BlockType,
    BlockCardSize,
    ILinkBlock,
    IPollBlock,
    IProductBlock,
    IBadge,
    IHeadingBlock,
    ISeparatorBlock,
} from "../../types/block";

const blockSchema = new Schema<IBlock>(
    {
        dodoPageId: {
            type: Schema.Types.ObjectId,
            ref: "DodoPage",
            required: true,
        },
        blockType: {
            type: String,
            enum: Object.values(BlockType),
            required: true,
        },
        blockPositionalIndex: { type: Number, required: true },
        blockCardSize: {
            type: String,
            enum: Object.values(BlockCardSize),
            required: true,
            default: BlockCardSize.NA,
        },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true,
    }
);

const badgeSchema = new Schema<IBadge>(
    {
        text: { type: String, required: true },
        color: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

const linkBlockSchema = new Schema<ILinkBlock>(
    {
        blockId: { type: Schema.Types.ObjectId, ref: "Block", required: true },
        title: { type: String, required: true },
        linkDisplayPicture: String,
        url: { type: String, required: true },
        badge: { type: Schema.Types.ObjectId, ref: "Badge" },
    },
    {
        timestamps: true,
    }
);

const pollBlockSchema = new Schema<IPollBlock>(
    {
        blockId: { type: Schema.Types.ObjectId, ref: "Block", required: true },
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        isMultipleOptionsAllowed: { type: Boolean, default: false },
        optionCounts: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

const productBlockSchema = new Schema<IProductBlock>(
    {
        blockId: { type: Schema.Types.ObjectId, ref: "Block", required: true },
        productImage: { type: String, required: true },
        title: { type: String, required: true },
        link: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

const headingBlockSchema = new Schema<IHeadingBlock>(
    {
        blockId: { type: Schema.Types.ObjectId, ref: "Block", required: true },
        title: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

const separatorBlockSchema = new Schema<ISeparatorBlock>(
    {
        blockId: { type: Schema.Types.ObjectId, ref: "Block", required: true },
        separatorType: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);


export {
    blockSchema,
    badgeSchema,
    linkBlockSchema,
    pollBlockSchema,
    productBlockSchema,
    headingBlockSchema,
    separatorBlockSchema,
};
