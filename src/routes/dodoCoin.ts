import { Router } from "express";
import { DodoCoinController } from "../controllers/dodoCoin/dodoCoinController";

const router = Router();

// Coin management routes
router.post("/update", DodoCoinController.updateCoins);
router.get("/user/:userId", DodoCoinController.getUserCoins);
router.post("/redeem", DodoCoinController.redeemCoins);

export { router as dodoCoinRouter };
