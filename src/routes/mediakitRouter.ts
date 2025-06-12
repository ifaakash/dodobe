import { Router } from "express";
import { MediaKitController } from "../controllers/mediakit/mediakitController";
import { authenticateUser } from "../middleware/auth";
import { upload } from "../middleware/fileUpload";
import { handleFileUploadError } from "../middleware/errorHandler";

const router: Router = Router();

// Public route for verifying the media kit
router.post("/verify", MediaKitController.verify);

// Protected route to check if the media kit is verified
router.get("/isverified", MediaKitController.checkVerified);
router.get("/details", MediaKitController.details);

// Route to add brand collaboration
router.post(
    "/brand-collab",
    authenticateUser,
    MediaKitController.addBrandCollab
);

// Route to upload analytics screenshot
router.post(
    "/analytics",
    authenticateUser,
    upload.fields([{ name: "screenshot", maxCount: 1 }]),
    handleFileUploadError,
    MediaKitController.uploadAnalytics
);

export { router as mediakitRouter };
