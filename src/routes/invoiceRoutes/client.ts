import { Router } from "express";
import { ClientController } from "../../controllers/invoice/clientController";

const router = Router();

router.post('/create', ClientController.createClient);

router.post('/getClients', ClientController.getClients)

router.patch('/update', ClientController.updateClient);

export { router as clientRouter };