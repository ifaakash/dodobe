import { Router } from "express";
import { BankDetailsController } from "../../controllers/invoice/bankDetailsController";

const router = Router();

router.post('/add', BankDetailsController.createBankDetails);

router.patch('/update', BankDetailsController.updateBankDetails);

export { router as bankDetailsRouter };