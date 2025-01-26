import { Router } from "express";
import { BlockController } from "../controllers/block/blockController";
import { upload } from "../middleware/fileUpload";
import { handleFileUploadError } from "../middleware/errorHandler";
import { RequestHandler } from "express";

const router: Router = Router();

// Create new block
router.post(
    "/create",
    upload.fields([
        { name: "linkDisplayPicture", maxCount: 1 },
        { name: "productImage", maxCount: 1 },
    ]) as RequestHandler,
    handleFileUploadError,
    BlockController.createBlock as RequestHandler
);

// Update block
router.patch(
    "/update/:blockId",
    upload.fields([
        { name: "linkDisplayPicture", maxCount: 1 },
        { name: "productImage", maxCount: 1 },
    ]) as RequestHandler,
    handleFileUploadError,
    BlockController.updateBlock
);

// Reorder blocks
router.post("/reorder", BlockController.reorderBlocks as RequestHandler);

// Delete block
router.delete("/delete/:blockId", BlockController.deleteBlock);

export { router as blockRouter };
