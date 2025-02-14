import { Router } from "express";
import { DodoPageController } from "../controllers/dodoPage/dodoPageController";
import { upload } from "../middleware/fileUpload";
import { handleFileUploadError } from "../middleware/errorHandler";

const router: Router = Router();

// Create new DodoPage
router.post(
    "/create",
    upload.fields([
        { name: "profilePicture", maxCount: 1 },
        { name: "audioBio", maxCount: 1 },
    ]),
    handleFileUploadError,
    DodoPageController.createDodoPage
);

// Get DodoPage by custom URL
router.get("/get-by-url/:url", DodoPageController.getDodoPageByUrl);

// Get DodoPage by ID
router.get("/get-by-id/:pageId", DodoPageController.getDodoPageById);

// Get all DodoPages for a user
router.get("/get-by-user/:userId", DodoPageController.getUserDodoPages);

// Update DodoPage
router.patch(
    "/update/:id",
    upload.fields([
        { name: "profilePicture", maxCount: 1 },
        { name: "audioBio", maxCount: 1 },
    ]),
    handleFileUploadError,
    DodoPageController.updateDodoPage
);

// Delete DodoPage
router.delete("/delete/:pageId", DodoPageController.deleteDodoPage);

export { router as dodoPageRouter };
