import { Router } from "express";
import { generateContent } from "../controllers/contentController";

const router = Router();

router.post("/generate", generateContent);

export default router;
