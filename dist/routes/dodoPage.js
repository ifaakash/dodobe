"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dodoPageRouter = void 0;
const express_1 = require("express");
const dodoPageController_1 = require("../controllers/dodoPage/dodoPageController");
const fileUpload_1 = require("../middleware/fileUpload");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
exports.dodoPageRouter = router;
// Create new DodoPage
router.post("/create", fileUpload_1.upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "audioBio", maxCount: 1 },
]), errorHandler_1.handleFileUploadError, dodoPageController_1.DodoPageController.createDodoPage);
// Get DodoPage by custom URL
router.get("/get-by-url/:url", dodoPageController_1.DodoPageController.getDodoPageByUrl);
// Get DodoPage by ID
router.get("/get/:pageId", dodoPageController_1.DodoPageController.getDodoPageById);
// Get all DodoPages for a user
router.get("/get-by-user/:userId", dodoPageController_1.DodoPageController.getUserDodoPages);
// Update DodoPage
router.patch("/update/:pageId", fileUpload_1.upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "audioBio", maxCount: 1 },
]), errorHandler_1.handleFileUploadError, dodoPageController_1.DodoPageController.updateDodoPage);
// Delete DodoPage
router.delete("/delete/:pageId", dodoPageController_1.DodoPageController.deleteDodoPage);
