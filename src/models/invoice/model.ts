import { model } from "mongoose";
import {
    IInvoice,
    IItem,
    IBankDetail,
    IRecipientDetail,
    IClientDetail,
} from "../../types/invoice";
import {
    invoiceSchema,
    itemSchema,
    bankDetailSchema,
    recipientDetailSchema,
    clientDetailSchema,
} from "./schema";

const InvoiceModel = model<IInvoice>("Invoice", invoiceSchema);
const ItemModel = model<IItem>("Item", itemSchema);
const BankDetailModel = model<IBankDetail>("BankDetail", bankDetailSchema);
const RecipientDetailModel = model<IRecipientDetail>(
    "RecipientDetail",
    recipientDetailSchema
);
const ClientDetailModel = model<IClientDetail>(
    "ClientDetail",
    clientDetailSchema
);

export {
    InvoiceModel,
    ItemModel,
    BankDetailModel,
    RecipientDetailModel,
    ClientDetailModel,
};