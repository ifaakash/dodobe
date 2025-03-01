import { Router } from "express";
import { AuthController } from "../controllers/auth/authController";

const router: Router = Router();

// Initial registration after firebase login
router.post("/register", AuthController.registerUser);

// Complete profile with additional details
router.post("/complete-profile", AuthController.completeProfile);

// Get user details
router.get("/user/:userId", AuthController.getUserDetails);

// Update user details
// router.patch("/update/:userId", AuthController.updateUserDetails);

export { router as authRouter };
