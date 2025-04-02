import { Router } from "express";
import { RecipientController } from "../../controllers/invoice/recipientController";

const router = Router();

router.post('/create', RecipientController.createRecipient);

router.post('/getRecipients', RecipientController.getRecipients);

router.patch('/update/:recipientId', RecipientController.updateRecipient);

export { router as recipientRouter };