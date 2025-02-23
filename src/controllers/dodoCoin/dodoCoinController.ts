import { Request, Response } from "express";
import { UserModel } from "../../models/user/model";
import {
    CoinTransactionModel,
    RedeemableItemModel,
} from "../../models/dodoCoin/model";
import {
    UpdateCoinsRequest,
    UpdateCoinsResponse,
    UpdateCoinsResponseError,
    RedeemCoinsRequest,
    GetUserCoinsResponse,
    RedeemCoinsResponse,
    RedeemCoinsResponseError,
    TransactionType,
} from "../../types/dodoCoin";
import { logger } from "../../utils/logger";
import { ID } from "../../types/common";

export class DodoCoinController {
    /**
     * Update user's coin balance and create transaction record
     */
    public static async updateCoins(
        req: Request<{}, {}, UpdateCoinsRequest>,
        res: Response<UpdateCoinsResponse | UpdateCoinsResponseError>
    ) {
        try {
            const {
                userId,
                amount,
                transactionType,
                description,
                milestoneType,
            } = req.body;

            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    msg: "User not found",
                });
            }

            // Initialize coinTransactions if undefined
            if (!user.coinTransactions) {
                user.coinTransactions = [];
            }

            // Verify sufficient balance for spending
            if (
                transactionType === TransactionType.SPENT &&
                (user.dodoCoins || 0) < amount
            ) {
                return res.status(400).json({
                    success: false,
                    msg: "Insufficient coin balance",
                });
            }

            // Create transaction
            const transaction = await CoinTransactionModel.create({
                userId,
                amount,
                transactionType,
                description,
                milestoneType,
            });

            // Update user's balance only
            user.dodoCoins =
                (user.dodoCoins || 0) +
                (transactionType === TransactionType.EARNED ? amount : -amount);

            await user.save();

            return res.status(200).json({
                success: true,
                data: {
                    newBalance: user.dodoCoins,
                    transaction,
                },
            });
        } catch (error) {
            logger.error("Error in updateCoins:", error);
            return res.status(500).json({
                success: false,
                msg: "Internal server error: " + error,
            });
        }
    }

    /**
     * Get user's coin balance and transaction history
     */
    public static async getUserCoins(
        req: Request<{ userId: string }>,
        res: Response<GetUserCoinsResponse>
    ) {
        try {
            const { userId } = req.params;

            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    data: { currentBalance: 0, transactions: [] },
                    msg: "User not found",
                });
            }

            const transactions = await CoinTransactionModel.find({ userId })
                .sort({ createdAt: -1 })
                .limit(50);

            return res.status(200).json({
                success: true,
                data: {
                    currentBalance: user.dodoCoins || 0,
                    transactions,
                },
                msg: "Coins fetched successfully",
            });
        } catch (error) {
            logger.error("Error in getUserCoins:", error);
            return res.status(500).json({
                success: false,
                data: { currentBalance: 0, transactions: [] },
                msg: "Internal server error: " + error,
            });
        }
    }

    /**
     * Redeem coins for an item
     */
    public static async redeemCoins(
        req: Request<{}, {}, RedeemCoinsRequest>,
        res: Response<RedeemCoinsResponse | RedeemCoinsResponseError>
    ) {
        try {
            const { userId, itemId } = req.body;

            const [user, redeemableItem] = await Promise.all([
                UserModel.findById(userId),
                RedeemableItemModel.findById(itemId),
            ]);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    msg: "User not found",
                });
            }

            if (!redeemableItem || !redeemableItem.isActive) {
                return res.status(404).json({
                    success: false,
                    msg: "Item not found or not available",
                });
            }

            // Initialize coinTransactions if undefined
            if (!user.coinTransactions) {
                user.coinTransactions = [];
            }

            if ((user.dodoCoins || 0) < redeemableItem.coinCost) {
                return res.status(400).json({
                    success: false,
                    msg: "Insufficient coin balance",
                });
            }

            // Create redemption transaction
            const transaction = await CoinTransactionModel.create({
                userId,
                amount: redeemableItem.coinCost,
                transactionType: TransactionType.REDEEMED,
                description: `Redeemed for ${redeemableItem.name}`,
                metadata: { itemId: redeemableItem._id },
            });

            // Update user's balance
            user.dodoCoins = (user.dodoCoins || 0) - redeemableItem.coinCost;
            user.coinTransactions.push(transaction._id as ID);
            await user.save();

            return res.status(200).json({
                success: true,
                data: {
                    remainingBalance: user.dodoCoins,
                    redeemedItem: redeemableItem,
                },
                msg: "Item redeemed successfully",
            });
        } catch (error) {
            logger.error("Error in redeemCoins:", error);
            return res.status(500).json({
                success: false,
                msg: "Internal server error: " + error,
            });
        }
    }
}
