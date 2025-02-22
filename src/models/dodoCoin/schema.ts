import { Schema } from "mongoose";
import {
    ICoinTransaction,
    ICoinMilestone,
    IRedeemableItem,
    TransactionType,
    CoinMilestoneType,
} from "../../types/dodoCoin";

const coinTransactionSchema = new Schema<ICoinTransaction>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        amount: { type: Number, required: true },
        transactionType: {
            type: String,
            enum: Object.values(TransactionType),
            required: true,
        },
        description: { type: String, required: true },
        milestoneType: {
            type: String,
            enum: Object.values(CoinMilestoneType),
            sparse: true,
        },
        metadata: { type: Schema.Types.Mixed },
    },
    {
        timestamps: true,
    }
);

const coinMilestoneSchema = new Schema<ICoinMilestone>(
    {
        type: {
            type: String,
            enum: Object.values(CoinMilestoneType),
            required: true,
            unique: true,
        },
        coinReward: { type: Number, required: true },
        isActive: { type: Boolean, default: true },
        conditions: {
            threshold: { type: Number, required: true },
            frequency: { type: String },
        },
    },
    {
        timestamps: true,
    }
);

const redeemableItemSchema = new Schema<IRedeemableItem>(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        coinCost: { type: Number, required: true },
        isActive: { type: Boolean, default: true },
        type: { type: String, required: true },
        metadata: { type: Schema.Types.Mixed },
    },
    {
        timestamps: true,
    }
);

export { coinTransactionSchema, coinMilestoneSchema, redeemableItemSchema };
