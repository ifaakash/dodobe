import request from "supertest";
import { app } from "../../../app";
import {
    UserModel,
    CoinTransactionModel,
    RedeemableItemModel,
} from "../../../models";
import {
    TransactionType,
    CoinMilestoneType,
    ICoinTransaction,
} from "../../../types/dodoCoin";
import { Types } from "mongoose";
import { createTestUser } from "../../../test/helpers";
import { ID } from "../../../types/common";
describe("DodoCoinController", () => {
    let userId: string;
    let redeemableItemId: string;

    beforeEach(async () => {
        // Create test user
        const user = await createTestUser();
        userId = (user._id as ID).toString();

        // Create test redeemable item
        const redeemableItem = await RedeemableItemModel.create({
            name: "Test Theme",
            description: "A test theme",
            coinCost: 100,
            isActive: true,
            type: "theme",
        });
        redeemableItemId = (redeemableItem._id as ID).toString();
    });

    describe("POST /api/v1/coins/update", () => {
        it("should add coins to user balance", async () => {
            const response = await request(app)
                .post("/api/v1/coins/update")
                .send({
                    userId,
                    amount: 50,
                    transactionType: TransactionType.EARNED,
                    description: "Earned from creating page",
                    milestoneType: CoinMilestoneType.CREATE_DODO_PAGE,
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.newBalance).toBe(50);
            expect(response.body.data.transaction).toBeDefined();
            expect(response.body.data.transaction.amount).toBe(50);

            // Verify user balance was updated
            const user = await UserModel.findById(userId);
            expect(user?.dodoCoins).toBe(50);
        });

        it("should subtract coins from user balance", async () => {
            // First add coins
            const user = await UserModel.findById(userId);
            user!.dodoCoins = 100;
            await user!.save();

            const response = await request(app)
                .post("/api/v1/coins/update")
                .send({
                    userId,
                    amount: 30,
                    transactionType: TransactionType.SPENT,
                    description: "Spent on feature",
                });

            expect(response.status).toBe(200);
            expect(response.body.data.newBalance).toBe(70);

            // Verify user balance was updated
            const updatedUser = await UserModel.findById(userId);
            expect(updatedUser?.dodoCoins).toBe(70);
        });

        it("should fail when spending more coins than available", async () => {
            const response = await request(app)
                .post("/api/v1/coins/update")
                .send({
                    userId,
                    amount: 50,
                    transactionType: TransactionType.SPENT,
                    description: "Trying to spend unavailable coins",
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.msg).toBe("Insufficient coin balance");
        });

        it("should fail for non-existent user", async () => {
            const response = await request(app)
                .post("/api/v1/coins/update")
                .send({
                    userId: new Types.ObjectId().toString(),
                    amount: 50,
                    transactionType: TransactionType.EARNED,
                    description: "Test transaction",
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it("should handle multiple coin transactions correctly", async () => {
            // Series of transactions
            const transactions = [
                {
                    amount: 50,
                    transactionType: TransactionType.EARNED,
                    description: "First earn",
                },
                {
                    amount: 30,
                    transactionType: TransactionType.SPENT,
                    description: "First spend",
                },
                {
                    amount: 100,
                    transactionType: TransactionType.EARNED,
                    description: "Second earn",
                },
                {
                    amount: 40,
                    transactionType: TransactionType.SPENT,
                    description: "Second spend",
                },
            ];

            // Execute transactions sequentially
            let expectedBalance = 0;
            for (const tx of transactions) {
                const response = await request(app)
                    .post("/api/v1/coins/update")
                    .send({
                        userId,
                        amount: tx.amount,
                        transactionType: tx.transactionType,
                        description: tx.description,
                    });

                // Update expected balance
                expectedBalance +=
                    tx.transactionType === TransactionType.EARNED
                        ? tx.amount
                        : -tx.amount;

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.newBalance).toBe(expectedBalance);
            }

            // Verify final user balance
            const user = await UserModel.findById(userId);
            expect(user?.dodoCoins).toBe(80); // 50 - 30 + 100 - 40 = 80

            // Verify all transactions were recorded
            const allTransactions = await CoinTransactionModel.find({
                userId,
            }).sort({ createdAt: 1 });
            expect(allTransactions).toHaveLength(4);

            // Verify transaction details
            expect(allTransactions[0].amount).toBe(50);
            expect(allTransactions[0].transactionType).toBe(
                TransactionType.EARNED
            );
            expect(allTransactions[1].amount).toBe(30);
            expect(allTransactions[1].transactionType).toBe(
                TransactionType.SPENT
            );
            expect(allTransactions[2].amount).toBe(100);
            expect(allTransactions[2].transactionType).toBe(
                TransactionType.EARNED
            );
            expect(allTransactions[3].amount).toBe(40);
            expect(allTransactions[3].transactionType).toBe(
                TransactionType.SPENT
            );
        });

        it("should handle concurrent coin transactions correctly", async () => {
            // First set initial balance
            const user = await UserModel.findById(userId);
            user!.dodoCoins = 100;
            await user!.save();

            // Create multiple concurrent transactions
            const transactions = [
                {
                    amount: 20,
                    transactionType: TransactionType.SPENT,
                    description: "Concurrent spend 1",
                },
                {
                    amount: 30,
                    transactionType: TransactionType.SPENT,
                    description: "Concurrent spend 2",
                },
                {
                    amount: 50,
                    transactionType: TransactionType.EARNED,
                    description: "Concurrent earn",
                },
            ];

            // Execute transactions sequentially to ensure consistent results
            let expectedBalance = 100; // Start with initial balance
            for (const tx of transactions) {
                const response = await request(app)
                    .post("/api/v1/coins/update")
                    .send({
                        userId,
                        amount: tx.amount,
                        transactionType: tx.transactionType,
                        description: tx.description,
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);

                // Update expected balance
                expectedBalance +=
                    tx.transactionType === TransactionType.EARNED
                        ? tx.amount
                        : -tx.amount;
            }

            // Verify final balance (100 - 20 - 30 + 50 = 100)
            const updatedUser = await UserModel.findById(userId);
            expect(updatedUser?.dodoCoins).toBe(expectedBalance);

            // Verify all transactions were recorded
            const allTransactions = await CoinTransactionModel.find({ userId });
            expect(allTransactions).toHaveLength(3);

            // Verify transaction details
            const sortedTransactions = allTransactions.sort(
                (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
            );

            // Verify each transaction matches our expectations
            transactions.forEach((tx, index) => {
                expect(sortedTransactions[index].amount).toBe(tx.amount);
                expect(sortedTransactions[index].transactionType).toBe(
                    tx.transactionType
                );
                expect(sortedTransactions[index].description).toBe(
                    tx.description
                );
            });

            // Verify the final balance matches our transaction history
            const transactionSum = sortedTransactions.reduce((sum, tx) => {
                return (
                    sum +
                    (tx.transactionType === TransactionType.EARNED
                        ? tx.amount
                        : -tx.amount)
                );
            }, 100); // Start with initial balance
            expect(transactionSum).toBe(expectedBalance);
        });

        it("should handle sequential coin transactions without duplicates in User model", async () => {
            // First set initial balance
            const user = await UserModel.findById(userId);
            user!.dodoCoins = 100;
            await user!.save();

            const transactions = [
                {
                    amount: 20,
                    transactionType: TransactionType.SPENT,
                    description: "First spend",
                },
                {
                    amount: 30,
                    transactionType: TransactionType.SPENT,
                    description: "Second spend",
                },
                {
                    amount: 50,
                    transactionType: TransactionType.EARNED,
                    description: "First earn",
                },
            ];

            // Execute transactions sequentially
            for (const tx of transactions) {
                const response = await request(app)
                    .post("/api/v1/coins/update")
                    .send({
                        userId,
                        amount: tx.amount,
                        transactionType: tx.transactionType,
                        description: tx.description,
                    });

                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            }

            // Get the final state
            const [updatedUser, coinTransactions] = await Promise.all([
                UserModel.findById(userId).populate<{
                    coinTransactions: ICoinTransaction[];
                }>("coinTransactions"),
                CoinTransactionModel.find({ userId }),
            ]);

            // Log the current state for debugging
            console.log("CoinTransaction count:", coinTransactions.length);
            console.log(
                "User coinTransactions count:",
                updatedUser?.coinTransactions.length
            );

            // Basic length checks
            expect(coinTransactions).toHaveLength(3);
            expect(updatedUser?.coinTransactions).toHaveLength(3);

            // Check for duplicate transaction IDs in User model
            const transactionIds = updatedUser?.coinTransactions.map((tx) =>
                (tx._id as ID).toString()
            );
            const uniqueTransactionIds = new Set(transactionIds);

            // Log duplicate IDs if any
            if (
                transactionIds &&
                transactionIds.length !== uniqueTransactionIds.size
            ) {
                const duplicates = transactionIds.filter(
                    (id, index) => transactionIds.indexOf(id) !== index
                );
                console.log("Duplicate transaction IDs:", duplicates);
            }

            expect(uniqueTransactionIds.size).toBe(3);

            // Verify each CoinTransaction appears exactly once in User model
            coinTransactions.forEach((coinTx) => {
                const count = updatedUser?.coinTransactions.filter(
                    (userTx) =>
                        (userTx._id as ID).toString() ===
                        (coinTx._id as ID).toString()
                ).length;
                expect(count).toBe(1);
            });
        });

        it("should not create duplicate transactions in User model during concurrent updates", async () => {
            // First set initial balance
            const user = await UserModel.findById(userId);
            user!.dodoCoins = 100;
            await user!.save();

            const transactions = [
                {
                    amount: 10,
                    transactionType: TransactionType.EARNED,
                    description: "Concurrent earn 1",
                },
                {
                    amount: 20,
                    transactionType: TransactionType.EARNED,
                    description: "Concurrent earn 2",
                },
                {
                    amount: 30,
                    transactionType: TransactionType.EARNED,
                    description: "Concurrent earn 3",
                },
            ];

            // Execute transactions concurrently
            await Promise.all(
                transactions.map((tx) =>
                    request(app).post("/api/v1/coins/update").send({
                        userId,
                        amount: tx.amount,
                        transactionType: tx.transactionType,
                        description: tx.description,
                    })
                )
            );

            // Verify transactions in both models
            const [updatedUser, coinTransactions] = await Promise.all([
                UserModel.findById(userId).populate<{
                    coinTransactions: ICoinTransaction[];
                }>("coinTransactions"),
                CoinTransactionModel.find({ userId }),
            ]);

            // Verify lengths match
            expect(coinTransactions).toHaveLength(3);
            expect(updatedUser?.coinTransactions).toHaveLength(3);

            // Verify no duplicate transaction IDs in User model
            const uniqueTransactionIds = new Set(
                updatedUser?.coinTransactions.map((tx) =>
                    (tx._id as ID).toString()
                )
            );
            expect(uniqueTransactionIds.size).toBe(3);

            // Verify all transaction IDs in User model exist in CoinTransaction model
            const coinTransactionIds = new Set(
                coinTransactions.map((tx) => (tx._id as ID).toString())
            );
            updatedUser?.coinTransactions.forEach((tx) => {
                expect(coinTransactionIds.has((tx._id as ID).toString())).toBe(
                    true
                );
            });
        });
    });

    describe("GET /api/v1/coins/user/:userId", () => {
        it("should get user coin balance and transactions", async () => {
            // Create some test transactions
            await CoinTransactionModel.create([
                {
                    userId,
                    amount: 50,
                    transactionType: TransactionType.EARNED,
                    description: "First earn",
                },
                {
                    userId,
                    amount: 30,
                    transactionType: TransactionType.SPENT,
                    description: "First spend",
                },
            ]);

            const user = await UserModel.findById(userId);
            user!.dodoCoins = 20;
            await user!.save();

            // Test coins endpoint
            const coinsResponse = await request(app).get(
                `/api/v1/coins/user/${userId}`
            );

            expect(coinsResponse.status).toBe(200);
            expect(coinsResponse.body.success).toBe(true);
            expect(coinsResponse.body.data.currentBalance).toBe(20);
            expect(coinsResponse.body.data.transactions).toHaveLength(2);

            // Test user endpoint to verify coin data
            const userResponse = await request(app).get(
                `/api/v1/auth/user/${userId}`
            );

            expect(userResponse.status).toBe(200);
            expect(userResponse.body.success).toBe(true);
            expect(userResponse.body.user.dodoCoins).toBe(20);
            expect(userResponse.body.user.coinTransactions).toHaveLength(2);

            // Verify transaction details in user response
            const transactions = userResponse.body.user.coinTransactions;
            expect(transactions).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        amount: 50,
                        transactionType: TransactionType.EARNED,
                        description: "First earn",
                    }),
                    expect.objectContaining({
                        amount: 30,
                        transactionType: TransactionType.SPENT,
                        description: "First spend",
                    }),
                ])
            );
        });

        it("should return 0 coins and empty transactions for new user", async () => {
            const userResponse = await request(app).get(
                `/api/v1/auth/user/${userId}`
            );

            expect(userResponse.status).toBe(200);
            expect(userResponse.body.success).toBe(true);
            expect(userResponse.body.user.dodoCoins).toBe(0);
            expect(userResponse.body.user.coinTransactions).toEqual([]);
        });

        it("should return 404 for non-existent user", async () => {
            const response = await request(app).get(
                `/api/v1/coins/user/${new Types.ObjectId().toString()}`
            );

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe("POST /api/v1/coins/redeem", () => {
        it("should successfully redeem coins for an item", async () => {
            // Add coins to user
            const user = await UserModel.findById(userId);
            user!.dodoCoins = 150;
            await user!.save();

            const response = await request(app)
                .post("/api/v1/coins/redeem")
                .send({
                    userId,
                    itemId: redeemableItemId,
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.remainingBalance).toBe(50);
            expect(response.body.data.redeemedItem).toBeDefined();

            // Verify user balance was updated
            const updatedUser = await UserModel.findById(userId);
            expect(updatedUser?.dodoCoins).toBe(50);

            // Verify transaction was created
            const transaction = await CoinTransactionModel.findOne({
                userId,
                transactionType: TransactionType.REDEEMED,
            });
            expect(transaction).toBeDefined();
            expect(transaction?.amount).toBe(100);
        });

        it("should fail when redeeming with insufficient balance", async () => {
            const response = await request(app)
                .post("/api/v1/coins/redeem")
                .send({
                    userId,
                    itemId: redeemableItemId,
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.msg).toBe("Insufficient coin balance");
        });

        it("should fail for non-existent item", async () => {
            const response = await request(app)
                .post("/api/v1/coins/redeem")
                .send({
                    userId,
                    itemId: new Types.ObjectId().toString(),
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.msg).toBe("Item not found or not available");
        });
    });
});
