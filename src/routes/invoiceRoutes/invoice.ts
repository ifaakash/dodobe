import { Router } from "express";
import { InvoiceController } from "../../controllers/invoice/invoiceControllers";
import { RecipientController } from "../../controllers/invoice/recipientController";

const router = Router();

router.post('/create', InvoiceController.createInvoice);

router.post('/getAllInvoices', InvoiceController.getAllInvoices);

router.get('/getInvoice/:invoiceId', InvoiceController.getInvoiceById);

router.post('/getInvoiceStats', InvoiceController.getInvoiceStats);

router.put('/addSubHeading', InvoiceController.addSubHeading)

export { router as invoiceRouter };