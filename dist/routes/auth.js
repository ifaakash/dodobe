"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const authController_1 = require("../controllers/auth/authController");
const router = (0, express_1.Router)();
exports.authRouter = router;
// Initial registration after firebase login
router.post("/register", authController_1.AuthController.registerUser);
// Complete profile with additional details
router.post("/complete-profile", authController_1.AuthController.completeProfile);
// Get user details
router.get("/user/:userId", authController_1.AuthController.getUserDetails);
