"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockRouter = void 0;
const express_1 = require("express");
const blockController_1 = require("../controllers/block/blockController");
const fileUpload_1 = require("../middleware/fileUpload");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
exports.blockRouter = router;
// Create new block
router.post("/create", fileUpload_1.upload.fields([
    { name: "linkDisplayPicture", maxCount: 1 },
    { name: "productImage", maxCount: 1 },
]), errorHandler_1.handleFileUploadError, blockController_1.BlockController.createBlock);
// Update block
router.patch("/update/:blockId", fileUpload_1.upload.fields([
    { name: "linkDisplayPicture", maxCount: 1 },
    { name: "productImage", maxCount: 1 },
]), errorHandler_1.handleFileUploadError, blockController_1.BlockController.updateBlock);
// Reorder blocks
router.post("/reorder", blockController_1.BlockController.reorderBlocks);
// Delete block
router.delete("/delete/:blockId", blockController_1.BlockController.deleteBlock);
