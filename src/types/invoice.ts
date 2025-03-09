import { BaseDocument, ID } from "./common";

export enum InvoiceStatus {
  PAID = "paid",
  UNPAID = "unPaid",
}

export interface IItem extends BaseDocument {
  _id: ID;
  invoiceId?: ID;
  name: string;
  quantity: number;
  price: number;
  isDeleted?: boolean;
  isNewItem?: boolean;
}

export interface IInvoice extends BaseDocument {
  _id: ID;
  invoiceNumber: number;
  userId: ID;
  items: IItem[];
  subHeading: string;
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
  _id: ID;
  userId: ID;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountName: string;
  upiId?: string;
}

export interface IRecipientDetail extends BaseDocument {
  _id: ID;
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
  _id: ID;
  userId: ID;
  email: string;
  name: string;
  state: string;
  city: string;
  address: string;
  zipcode: string;
  gst?: string;
  pan?: string;
  logo?: string;
}

// Bank Details Req/Res Types

export interface CreateBankDetailsRequest {
  userId: ID;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountName: string;
  upiId?: string;
}

export interface CreateBankDetailsResponse {
  success: boolean;
  msg: string;
  data?: IBankDetail;
}

// Client Details Req/Res Types

export interface CreateClientRequest {
  userId: ID;
  email: string;
  name: string;
  state: string;
  city: string;
  address: string;
  zipcode: string;
}

export interface CreateClientResponse {
  success: boolean;
  msg: string;
  data?: IClientDetail;
}

export interface GetClientsRequest {
  userId: ID;
}

export interface GetClientsResponse {
  success: boolean;
  msg: string;
  data?: IClientDetail[];
}

// Recipient Details Req/Res Types

export interface CreateRecipientRequest {
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

export interface CreateRecipientResponse {
  success: boolean;
  msg: string;
  data?: IRecipientDetail;
}

export interface GetRecipientsRequest {
  userId: ID;
}

export interface GetRecipientsResponse {
  success: boolean;
  msg: string;
  data?: IRecipientDetail[];
}

// Invoice Req/Res Types

export interface CreateInvoiceRequest {
  userId: ID;
  items: IItem[];
  subHeading: string;
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

export interface CreateInvoiceResponse {
  success: boolean;
  msg: string;
  data?: IInvoice;
}

export interface GetAllInvoicesRequest {
  userId: ID;
}

export interface AddSubHeadingRequest {
  userId: ID;
  invoiceId: ID;
  subHeading: string;
}

export interface AddSubHeadingResponse {
  success: boolean;
  msg: string;
}

export interface GetInvoiceStatsRequest {
  userId: ID;
  timeFrame: string;
}

export interface GetInvoiceStatsResponse {
  success: boolean;
  data?: {
    invoices: {
      created: number;
      paid: number;
      due: number;
    };
    outStandingAmount: number;
    pendingAmount: number;
    paidAmount: number;
    totalAmount: number;
  };
  msg: string;
}

// Update Client Req/Res Types

export interface UpdateClientRequest {
  id: ID;
  name?: string;
  email?: string;
  state?: string;
  city?: string;
  address?: string;
  zipcode?: string;
  gst?: string;
  pan?: string;
}

export interface UpdateClientResponse {
  success: boolean;
  msg: string;
}


// Update Recipient Req/Res Types

export interface UpdateRecipientRequest {
  id: ID;
  name?: string;
  email?: string;
  state?: string;
  city?: string;
  address?: string;
  zipcode?: string;
  gst?: string;
  pan?: string;
}

export interface UpdateRecipientResponse {
  success: boolean;
  msg: string;
}

// Update Bank Details Req/Res Types

export interface UpdateBankDetailsRequest {
  id: ID;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountName?: string;
  upiId?: string;
}

export interface UpdateBankDetailsResponse {
  success: boolean;
  msg: string;
}


// Update Items and Notes Req/Res Types

export interface UpdateItemsAndNotesRequest {
  id: ID;
  items: IItem[];
  note: string;
  dueDate: Date;
  tds: number;
  gst: number;
  discount: number;
}

export interface UpdateItemsAndNotesResponse {
  success: boolean;
  msg: string;
}
