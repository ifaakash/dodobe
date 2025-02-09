import { Router } from "express";
import { BankDetailsController } from "../../controllers/invoice/bankDetailsController";

const router = Router();

router.post('/add', BankDetailsController.createBankDetails);

export { router as bankDetailsRouter };