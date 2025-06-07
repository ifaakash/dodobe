"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollVoteRouter = exports.blockRouter = void 0;
const express_1 = require("express");
const blockController_1 = require("../controllers/block/blockController");
const fileUpload_1 = require("../middleware/fileUpload");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
exports.blockRouter = router;
const pollVoteRouter = (0, express_1.Router)();
exports.pollVoteRouter = pollVoteRouter;
// Create new block
router.post("/create", fileUpload_1.upload.fields([
    { name: "linkDisplayPicture", maxCount: 1 },
    { name: "productImage", maxCount: 1 },
]), errorHandler_1.handleFileUploadError, blockController_1.BlockController.createBlock);
// Get blocks by DodoPage URL
router.get("/get/:dodoPageUrl", blockController_1.BlockController.getBlocksByDodoPageUrl);
// Update block
router.patch("/update", fileUpload_1.upload.fields([
    { name: "linkDisplayPicture", maxCount: 1 },
    { name: "productImage", maxCount: 1 },
]), errorHandler_1.handleFileUploadError, blockController_1.BlockController.updateBlock);
// Reorder blocks
router.post("/reorder", blockController_1.BlockController.reorderBlocks);
// Archive block
// router.post("/archive", BlockController.archiveBlock as RequestHandler);
// Vote in Poll
// router.post("/poll-vote", BlockController.voteInPoll as RequestHandler);
// Get archived blocks
router.get("/get-archived-blocks/:dodoPageURL", blockController_1.BlockController.getArchivedBlocks);
// Delete block
router.delete("/delete", blockController_1.BlockController.deleteBlock);
// Get block by ID
router.get("/getById/:blockId", blockController_1.BlockController.getBlockById);
// Vote in Poll (for public access)
pollVoteRouter.post("/", blockController_1.BlockController.pollVote);
router.post('/get-poll-responses', blockController_1.BlockController.pollResponses);
