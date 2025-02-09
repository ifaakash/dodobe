import { Router } from "express";
import { BlockController } from "../controllers/block/blockController";
import { upload } from "../middleware/fileUpload";
import { handleFileUploadError } from "../middleware/errorHandler";
import { RequestHandler } from "express";

const router: Router = Router();

// Create new block
router.post("/create", upload.fields([
    { name: "linkDisplayPicture", maxCount: 1 },
    { name: "productImage", maxCount: 1 },
  ]) as RequestHandler,
  handleFileUploadError,
  BlockController.createBlock as RequestHandler
);

// Get blocks by DodoPage URL
router.get('/get/:dodoPageUrl', BlockController.getBlocksByDodoPageUrl);

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

// Archive block
router.post("/archive", BlockController.archiveBlock as RequestHandler<{ blockId: string }>);

// Get archived blocks
router.post("/getArchivedBlocks", BlockController.getArchivedBlocks as RequestHandler);

// Delete block
router.delete("/delete/:blockId", BlockController.deleteBlock as RequestHandler<{ blockId: string }>);

// Get block by ID
router.get("/getById/:blockId", BlockController.getBlockById as RequestHandler<{ blockId: string }>);

export { router as blockRouter };
