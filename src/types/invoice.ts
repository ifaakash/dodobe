import { BaseDocument, ID } from "./common";

export enum InvoiceStatus {
    PAID = "Paid",
    UNPAID = "Unpaid",
}

export interface IItem extends BaseDocument {
    invoiceId: ID;
    name: string;
    quantity: number;
    price: number;
}

export interface IInvoice extends BaseDocument {
    invoiceNumber: string;
    userId: ID;
    items: ID[];
    discount: number;
    note?: string;
    date: Date;
    dueDate: Date;
    gst: number;
    tds: number;
    status: InvoiceStatus;
    bankDetailId: ID;
    recipientDetailId: ID;
    clientDetailId: ID;
}

export interface IBankDetail extends BaseDocument {
    userId: ID;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountName: string;
    upiId?: string;
}

export interface IRecipientDetail extends BaseDocument {
    userId: ID;
    name: string;
    email: string;
    state: string;
    city: string;
    address: string;
    zipcode: string;
    gst?: string;
    pan?: string;
    logo?: string;
}

export interface IClientDetail extends BaseDocument {
    userId: ID;
    name: string;
    state: string;
    city: string;
    address: string;
    zipcode: string;
    gst?: string;
    pan?: string;
    logo?: string;
}
