import mongoose from "mongoose";
import { PageViewSchema, BlockInteractionSchema } from "./schema";
import { IPageView, IBlockInteraction } from "../../types/analytics";

export const PageViewModel = mongoose.model<IPageView>(
    "PageView",
    PageViewSchema
);
export const BlockInteractionModel = mongoose.model<IBlockInteraction>(
    "BlockInteraction",
    BlockInteractionSchema
);
