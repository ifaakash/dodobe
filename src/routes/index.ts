import { Router } from "express";
import { authRouter } from "./auth";
import { dodoPageRouter } from "./dodoPage";
import { blockRouter } from "./block";
import { invoiceRouter } from "./invoiceRoutes/invoice";
import { bankDetailsRouter } from "./invoiceRoutes/bankDetails";
import { clientRouter } from "./invoiceRoutes/client";
import { recipientRouter } from "./invoiceRoutes/recipient";

const router: Router = Router();

// API version prefix
const v1Router = Router();

v1Router.use("/auth", authRouter);

// Dodo page and its block
v1Router.use("/dodo-pages", dodoPageRouter);
v1Router.use("/blocks", blockRouter); 

// For invoice 
v1Router.use("/recipient", recipientRouter);
v1Router.use("/client", clientRouter)
v1Router.use("/bankDetails", bankDetailsRouter)

v1Router.use("/invoice", invoiceRouter)

// Health check
v1Router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
    });
});

router.use("/api/v1", v1Router);

export { router as apiRouter };
