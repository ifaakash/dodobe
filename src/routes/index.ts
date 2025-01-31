import { Router } from "express";
import { authRouter } from "./auth";
import { dodoPageRouter } from "./dodoPage";
import { blockRouter } from "./block";

const router: Router = Router();

// API version prefix
const v1Router = Router();

v1Router.use("/auth", authRouter);
v1Router.use("/dodo-pages", dodoPageRouter);
v1Router.use("/blocks", blockRouter); // Simple and direct

// Health check
v1Router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
    });
});

router.use("/api/v1", v1Router);

export { router as apiRouter };
