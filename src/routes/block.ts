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
  "/update",
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
router.post("/archive", BlockController.archiveBlock as RequestHandler);

// Unarchive block
router.post("/unarchive", BlockController.unarchiveBlock as RequestHandler);

// Get archived blocks
router.get("/get-archived-blocks/:dodoPageURL", BlockController.getArchivedBlocks as RequestHandler<{ dodoPageURL: string }>);

// Delete block
router.delete("/delete", BlockController.deleteBlock as RequestHandler);

// Get block by ID
router.get("/getById/:blockId", BlockController.getBlockById as RequestHandler<{ blockId: string }>);

router.post('/poll-vote', BlockController.pollVote as RequestHandler);

export { router as blockRouter };
