import { Router } from "express";
import { MediaKitController } from "../controllers/mediakit/mediakitController";
import { authenticateUser } from "../middleware/auth";

const router: Router = Router();

// Public route for verifying the media kit
router.post("/verify", MediaKitController.verify);

// Protected route to check if the media kit is verified
router.get("/isverified", MediaKitController.checkVerified);
router.get("/details", MediaKitController.details);

export { router as mediakitRouter };