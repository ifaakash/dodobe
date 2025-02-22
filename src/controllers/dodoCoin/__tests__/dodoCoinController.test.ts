import request from "supertest";
import { app } from "../../../app";
import {
    UserModel,
    CoinTransactionModel,
    RedeemableItemModel,
} from "../../../models";
import { TransactionType, CoinMilestoneType } from "../../../types/dodoCoin";
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
