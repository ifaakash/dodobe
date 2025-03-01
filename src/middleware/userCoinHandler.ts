import { coinTransactionSchema } from "@/models/dodoCoin/schema";
import { UserModel } from "@/models/user/model";
import { ID } from "@/types/common";

// Register all middlewares
export const registerCoinTransactionMiddleware = () => {
    // Middleware to automatically update user's coinTransactions after save
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

    // Handle deleteOne operation
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
};
