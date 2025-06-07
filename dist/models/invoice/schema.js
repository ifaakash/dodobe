"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientDetailSchema = exports.recipientDetailSchema = exports.bankDetailSchema = exports.itemSchema = exports.invoiceSchema = void 0;
const mongoose_1 = require("mongoose");
const invoice_1 = require("../../types/invoice");
const itemSchema = new mongoose_1.Schema({
    invoiceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Invoice",
        required: true,
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
}, {
    timestamps: true,
});
exports.itemSchema = itemSchema;
const bankDetailSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: { type: String, required: true },
    accountName: { type: String, required: true },
    upiId: String,
}, {
    timestamps: true,
});
exports.bankDetailSchema = bankDetailSchema;
const recipientDetailSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    zipcode: { type: String, required: true },
    gst: String,
    pan: String,
    logo: String,
}, {
    timestamps: true,
});
exports.recipientDetailSchema = recipientDetailSchema;
const clientDetailSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    zipcode: { type: String, required: true },
    gst: String,
    pan: String,
    logo: String,
}, {
    timestamps: true,
});
exports.clientDetailSchema = clientDetailSchema;
const invoiceSchema = new mongoose_1.Schema({
    invoiceNumber: { type: Number, required: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    items: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Item" }],
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
        enum: Object.values(invoice_1.InvoiceStatus),
        default: invoice_1.InvoiceStatus.UNPAID,
        required: true,
    },
    bankDetailId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BankDetail",
        required: true,
    },
    recipientDetailId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "RecipientDetail",
        required: true,
    },
    clientDetailId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "ClientDetail",
        required: true,
    },
}, {
    timestamps: true,
});
exports.invoiceSchema = invoiceSchema;
