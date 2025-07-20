import { Router } from "express";
import { MediaKitController } from "../controllers/mediakit/mediakitController";
import { authenticateUser } from "../middleware/auth";
import { upload } from "../middleware/fileUpload";
import { handleFileUploadError } from "../middleware/errorHandler";

const router: Router = Router();

// Public route to check if the media kit is verified
router.get("/is-verified/:instaId", MediaKitController.checkVerified);
// Public route for verifying the media kit
router.post("/verify", MediaKitController.verify);

// Get media kit details by instaId
router.get("/get-by-instaId/:instaId", MediaKitController.getDetailsByInstaId);

// Create a new media kit
router.post("/create", MediaKitController.createMediaKit);

// Update an existing media kit details by instaId
router.patch("/update", upload.single("mediaKitProfileImage"), handleFileUploadError, MediaKitController.updateMediaKit);

// Authenticated routes
// Route to add brand collaboration
router.post(
    "/add-brand-collab",
    // authenticateUser,
    upload.single("brandLogo"),
    handleFileUploadError,
    MediaKitController.addBrandCollab
);

// Route to update brand collaboration
router.patch(
    "/update-brand-collab",
    // authenticateUser,
    MediaKitController.updateBrandCollab
);

// Route to delete brand collaboration
router.delete(
    "/delete-brand-collab",
    // authenticateUser,
    MediaKitController.deleteBrandCollab
);

// Link media kit to a user
router.post(
    "/link-mediakit-to-user",
    authenticateUser,
    MediaKitController.linkMediaKit
);

// Route to upload analytics screenshot
router.post(
    "/analytics",
    // authenticateUser,
    upload.fields([{ name: "screenshot", maxCount: 1 }]),
    handleFileUploadError,
    MediaKitController.uploadAnalytics
);

// Join waitlist for media kit
router.post(
    "/join-waitlist",
    authenticateUser,
    MediaKitController.joinWaitlist
);

export { router as mediakitRouter };
