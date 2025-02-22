import { Schema } from "mongoose";
import {
    ICoinTransaction,
    ICoinMilestone,
    IRedeemableItem,
    TransactionType,
    CoinMilestoneType,
} from "../../types/dodoCoin";
import { UserModel } from "../user/model";
import { ID } from "@/types/common";

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

// Middleware to automatically update user's coinTransactions
coinTransactionSchema.post("save", async function (doc) {
    const user = await UserModel.findById(doc.userId);
    if (user && !user.coinTransactions.includes(doc._id as ID)) {
        user.coinTransactions.push(doc._id as ID);
        await user.save();
    }
});

// Middleware to clean up user's coinTransactions when a transaction is deleted
coinTransactionSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        const user = await UserModel.findById(doc.userId);
        if (user) {
            user.coinTransactions = user.coinTransactions.filter(
                (txId) => txId.toString() !== doc._id.toString()
            );
            await user.save();
        }
    }
});

coinTransactionSchema.post("deleteOne", async function (doc) {
    if (doc) {
        const user = await UserModel.findById(doc.userId);
        if (user) {
            user.coinTransactions = user.coinTransactions.filter(
                (txId) => txId.toString() !== doc._id.toString()
            );
            await user.save();
        }
    }
});

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
