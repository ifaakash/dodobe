import { model } from "mongoose";
import {
    IBlock,
    ILinkBlock,
    IPollBlock,
    IProductBlock,
    IBadge,
    IHeadingBlock,
    ISeparatorBlock,
} from "../../types/block";
import {
    blockSchema,
    badgeSchema,
    linkBlockSchema,
    pollBlockSchema,
    productBlockSchema,
    headingBlockSchema,
    separatorBlockSchema,
} from "./schema";

const BlockModel = model<IBlock>("Block", blockSchema);
const BadgeModel = model<IBadge>("Badge", badgeSchema);


const LinkBlockModel = model<ILinkBlock>("LinkBlock", linkBlockSchema);
const PollBlockModel = model<IPollBlock>("PollBlock", pollBlockSchema);
const ProductBlockModel = model<IProductBlock>(
    "ProductBlock",
    productBlockSchema
);
const HeadingBlockModel = model<IHeadingBlock>(
    "HeadingBlock",
    headingBlockSchema
);
const SeparatorBlockModel = model<ISeparatorBlock>(
    "SeparatorBlock",
    separatorBlockSchema
);

export {
    BlockModel,
    BadgeModel,
    LinkBlockModel,
    PollBlockModel,
    ProductBlockModel,
    HeadingBlockModel,
    SeparatorBlockModel
};
