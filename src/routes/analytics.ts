import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics/analyticsController";
import { authenticateUser } from "../middleware/auth";

const router: Router = Router();

// Public routes for recording analytics
router.post("/page-view", AnalyticsController.recordPageView);
router.post("/block-interaction", AnalyticsController.recordBlockInteraction);
router.post("/timeSpent", AnalyticsController.recordTimeSpent);

// Protected routes for retrieving analytics
router.get(
    "/dodo-page/:dodoPageId",
    authenticateUser,
    AnalyticsController.getDodoPageAnalytics
);

export { router as analyticsRouter };
