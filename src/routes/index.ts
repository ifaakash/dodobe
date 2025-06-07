import { Router } from "express";
import { authRouter } from "./auth";
import { dodoPageRouter, getByUrlRouter } from "./dodoPage";
import { blockRouter, pollVoteRouter } from "./block";
import { invoiceRouter } from "./invoiceRoutes/invoice";
import { bankDetailsRouter } from "./invoiceRoutes/bankDetails";
import { clientRouter } from "./invoiceRoutes/client";
import { recipientRouter } from "./invoiceRoutes/recipient";
import { dodoCoinRouter } from "./dodoCoin";
import { authenticateUser } from "../middleware/auth";
import { analyticsRouter } from "./analytics";
import { mediakitRouter } from "./mediakitRouter"
import contentRouter from "./contentRoutes";

const router: Router = Router();

// API version prefix
const v1Router = Router();

// Public routes (no auth required)
v1Router.use("/auth", authRouter);
v1Router.use("/dodo-pages/get-by-url", getByUrlRouter);
v1Router.use("/block/poll-vote", pollVoteRouter);

// Protected routes (auth required)
v1Router.use("/dodo-pages", authenticateUser, dodoPageRouter);
v1Router.use("/block", authenticateUser, blockRouter);
v1Router.use("/coins", authenticateUser, dodoCoinRouter);
v1Router.use("/client", authenticateUser, clientRouter);
v1Router.use("/bankDetails", authenticateUser, bankDetailsRouter);
v1Router.use("/recipient", authenticateUser, recipientRouter);
v1Router.use("/content", authenticateUser, contentRouter);

v1Router.use("/invoice", invoiceRouter);
v1Router.use("/analytics", analyticsRouter);


// Mediakit
v1Router.use("/mediakit", mediakitRouter);

// Health check
v1Router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: `DODO backend Server is running on port ${process.env.PORT}`,
    });
});

router.use("/api/v1", v1Router);

export { router as apiRouter };
