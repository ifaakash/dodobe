import { model } from "mongoose";
import {
    ICoinTransaction,
    ICoinMilestone,
    IRedeemableItem,
} from "../../types/dodoCoin";
import {
    coinTransactionSchema,
    coinMilestoneSchema,
    redeemableItemSchema,
} from "./schema";
import { registerCoinTransactionMiddleware } from "../../middleware/userCoinHandler";

// Register the middleware
registerCoinTransactionMiddleware();

const CoinTransactionModel = model<ICoinTransaction>(
    "CoinTransaction",
    coinTransactionSchema
);

const CoinMilestoneModel = model<ICoinMilestone>(
    "CoinMilestone",
    coinMilestoneSchema
);

const RedeemableItemModel = model<IRedeemableItem>(
    "RedeemableItem",
    redeemableItemSchema
);

export { CoinTransactionModel, CoinMilestoneModel, RedeemableItemModel };
