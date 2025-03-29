import { Router } from "express";
import { DodoPageController } from "../controllers/dodoPage/dodoPageController";
import { upload } from "../middleware/fileUpload";
import { handleFileUploadError } from "../middleware/errorHandler";

const router: Router = Router();
const getByUrlRouter = Router();

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
getByUrlRouter.get("/:url", DodoPageController.getDodoPageByUrl);

// Get DodoPage by ID
router.get("/get-by-id/:pageId", DodoPageController.getDodoPageById);

// Get all DodoPages for a user
router.get("/get-by-user/:userId", DodoPageController.getUserDodoPages);

// Update DodoPage
router.patch(
    "/update",
    upload.fields([
        { name: "profilePicture", maxCount: 1 },
        { name: "audioBio", maxCount: 1 },
    ]),
    handleFileUploadError,
    DodoPageController.updateDodoPage
);

// Delete DodoPage
router.delete("/delete/:pageId", DodoPageController.deleteDodoPage);

// Update DodoPage blocks
router.patch("/update-blocks/:pageId", DodoPageController.updateDodoPageBlocks);

export { router as dodoPageRouter, getByUrlRouter };
