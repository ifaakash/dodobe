import { Router } from "express";
import { AuthController } from "../controllers/auth/authController";

const router: Router = Router();

// Initial registration after OTPless
router.post("/register", AuthController.registerUser);

// Complete profile with additional details
router.post("/complete-profile", AuthController.completeProfile);

// Get user details
router.get("/user/:userId", AuthController.getUserDetails);

export { router as authRouter };
