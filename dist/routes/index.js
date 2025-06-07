"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const auth_1 = require("./auth");
const dodoPage_1 = require("./dodoPage");
const block_1 = require("./block");
const invoice_1 = require("./invoiceRoutes/invoice");
const bankDetails_1 = require("./invoiceRoutes/bankDetails");
const client_1 = require("./invoiceRoutes/client");
const recipient_1 = require("./invoiceRoutes/recipient");
const dodoCoin_1 = require("./dodoCoin");
const auth_2 = require("../middleware/auth");
const analytics_1 = require("./analytics");
const mediakitRouter_1 = require("./mediakitRouter");
const contentRoutes_1 = __importDefault(require("./contentRoutes"));
const router = (0, express_1.Router)();
exports.apiRouter = router;
// API version prefix
const v1Router = (0, express_1.Router)();
// Public routes (no auth required)
v1Router.use("/auth", auth_1.authRouter);
v1Router.use("/dodo-pages/get-by-url", dodoPage_1.getByUrlRouter);
v1Router.use("/block/poll-vote", block_1.pollVoteRouter);
// Protected routes (auth required)
v1Router.use("/dodo-pages", auth_2.authenticateUser, dodoPage_1.dodoPageRouter);
v1Router.use("/block", auth_2.authenticateUser, block_1.blockRouter);
v1Router.use("/coins", auth_2.authenticateUser, dodoCoin_1.dodoCoinRouter);
v1Router.use("/client", auth_2.authenticateUser, client_1.clientRouter);
v1Router.use("/bankDetails", auth_2.authenticateUser, bankDetails_1.bankDetailsRouter);
v1Router.use("/recipient", auth_2.authenticateUser, recipient_1.recipientRouter);
v1Router.use("/content", auth_2.authenticateUser, contentRoutes_1.default);
v1Router.use("/invoice", invoice_1.invoiceRouter);
v1Router.use("/analytics", analytics_1.analyticsRouter);
// Mediakit
v1Router.use("/mediakit", mediakitRouter_1.mediakitRouter);
// Health check
v1Router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: `DODO backend Server is running on port ${process.env.PORT}`,
    });
});
router.use("/api/v1", v1Router);
