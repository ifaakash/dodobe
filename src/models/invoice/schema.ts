import { Schema } from "mongoose";
import {
    IInvoice,
    InvoiceStatus,
    IItem,
    IBankDetail,
    IRecipientDetail,
    IClientDetail,
} from "../../types/invoice";

const itemSchema = new Schema<IItem>(
    {
        invoiceId: {
            type: Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
    },
    {
        timestamps: true,
    }
);

const bankDetailSchema = new Schema<IBankDetail>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        bankName: { type: String, required: true },
        accountNumber: { type: String, required: true },
        ifscCode: { type: String, required: true },
        accountName: { type: String, required: true },
        upiId: String,
    },
    {
        timestamps: true,
    }
);

const recipientDetailSchema = new Schema<IRecipientDetail>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        state: { type: String, required: true },
        city: { type: String, required: true },
        address: { type: String, required: true },
        zipcode: { type: String, required: true },
        gst: String,
        pan: String,
        logo: String,
    },
    {
        timestamps: true,
    }
);

const clientDetailSchema = new Schema<IClientDetail>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        email: { type: String, required: true },
        name: { type: String, required: true },
        state: { type: String, required: true },
        city: { type: String, required: true },
        address: { type: String, required: true },
        zipcode: { type: String, required: true },
        gst: String,
        pan: String,
        logo: String,
    },
    {
        timestamps: true,
    }
);

const invoiceSchema = new Schema<IInvoice>(
    {
        invoiceNumber: { type: Number, required: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        items: [{ type: Schema.Types.ObjectId, ref: "Item" }],
        subHeading: {
            type: String,
            default: "",
        },
        discount: { type: Number, default: 0 },
        note: String,
        date: { type: Date, required: true },
        dueDate: { type: Date, required: true },
        gst: { type: Number },
        tds: { type: Number },
        status: {
            type: String,
            enum: Object.values(InvoiceStatus),
            default: InvoiceStatus.UNPAID,
            required: true,
        },
        bankDetailId: {
            type: Schema.Types.ObjectId,
            ref: "BankDetail",
            required: true,
        },
        recipientDetailId: {
            type: Schema.Types.ObjectId,
            ref: "RecipientDetail",
            required: true,
        },
        clientDetailId: {
            type: Schema.Types.ObjectId,
            ref: "ClientDetail",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export {
    invoiceSchema,
    itemSchema,
    bankDetailSchema,
    recipientDetailSchema,
    clientDetailSchema,
};
