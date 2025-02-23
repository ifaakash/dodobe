import { Request, Response } from "express";
import {
  AddSubHeadingRequest,
  AddSubHeadingResponse,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  GetAllInvoicesRequest,
  GetInvoiceStatsRequest,
  GetInvoiceStatsResponse,
  IInvoice,
  IItem,
  InvoiceStatus,
} from "../../types/invoice";
import { InvoiceModel } from "../../models/invoice/model";
import { UserModel } from "../../models/user/model";
import { RecipientDetailModel } from "../../models/invoice/model";
import { ClientDetailModel } from "../../models/invoice/model";
import { BankDetailModel } from "../../models/invoice/model";
import { ItemModel } from "../../models/invoice/model";

export class InvoiceController {
  public static async createInvoice(
    req: Request<{}, {}, CreateInvoiceRequest>,
    res: Response<CreateInvoiceResponse>
  ) {
    try {
      const { userId, recipientDetailId, clientDetailId, bankDetailId, items } =
        req.body;

      // Check if User exists
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          msg: "User not found",
        });
      }

      // Check if Client Exists
      const client = await ClientDetailModel.findById(clientDetailId);
      if (!client) {
        return res.status(400).json({
          success: false,
          msg: "Client not found",
        });
      }

      // Check if Recipient Exists
      const recipient = await RecipientDetailModel.findById(recipientDetailId);
      if (!recipient) {
        return res.status(400).json({
          success: false,
          msg: "Recipient not found",
        });
      }

      // Check if Bank Details Exists
      const bankDetails = await BankDetailModel.findById(bankDetailId);
      if (!bankDetails) {
        return res.status(400).json({
          success: false,
          msg: "Bank Details not found",
        });
      }

      // Generate invoice number
      const lastInvoice = await InvoiceModel.findOne({ userId }).sort({
        createdAt: -1,
      });
      let nextNumber = lastInvoice ? lastInvoice.invoiceNumber + 1 : 1;

      console.log('ext', nextNumber)

      // Create and save the invoice
      const invoice: IInvoice = new InvoiceModel({
        ...req.body,
        invoiceNumber: nextNumber,
        items: [],
        subHeading: "",
      });
      await invoice.save();

      const itemsArray: IItem[] = await Promise.all(
        items.map(async (item: any) => {
          const newItem: IItem = new ItemModel({
            ...item,
            invoiceId: invoice._id,
          });
          await newItem.save();
          return newItem;
        })
      );

      invoice.items = itemsArray;
      await invoice.save();

      // Associate invoice with the user
      user.invoices.push(invoice._id as any);
      await user.save();

      return res.status(201).json({
        success: true,
        msg: "Invoice created",
        data: invoice,
      });
    } catch (error) {
      return res.status(500).json({
          success: false,
          msg: "Internal server error: " + error,
      });
    }
  }

  // Get all invoices by a user
  public static async getAllInvoices(
    req: Request<{}, {}, GetAllInvoicesRequest>,
    res: Response
  ) {
    try {
      const { userId } = req.body;

      const user = await UserModel.findById(userId);

      const userInvoices = await InvoiceModel.find({
        _id: { $in: user?.invoices },
      })
        .populate("items")
        .populate("clientDetailId")
        .populate("recipientDetailId")
        .populate("bankDetailId");

      const finalInvoices = userInvoices.map((invoice) => ({
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.date,
        dueDate: invoice.dueDate,
        items: invoice.items,
        clientDetails: invoice.clientDetailId,
        recipientDetails: invoice.recipientDetailId,
        bankDetails: invoice.bankDetailId,
        note: invoice.note,
        discount: invoice.discount,
        gst: invoice.gst,
        tds: invoice.tds,
        status: invoice.status,
        subHeading: invoice.subHeading,
      }));

      return res
        .status(200)
        .json({ success: true, data: finalInvoices, msg: "Invoices Fetched" });
    } catch (error) {
      const err = error as Error;
      console.log(err);
      return res.status(500).json({
          success: false,
          msg: "Internal server error: " + error,
      });
    }
  }

  public static async addSubHeading(
    req: Request<{}, {}, AddSubHeadingRequest>,
    res: Response<AddSubHeadingResponse>
  ) {
    try {
      const { subHeading, invoiceId } = req.body;

      // Ensure invoiceId is provided
      if (!invoiceId) {
        return res.status(400).json({
          success: false,
          msg: "Invoice ID is required",
        });
      }

      const currentInvoice = await InvoiceModel.findById(invoiceId);
      // Check if invoice exists
      if (!currentInvoice) {
        return res.status(404).json({
          success: false,
          msg: "Invoice not found",
        });
      }

      currentInvoice.subHeading = subHeading;
      await currentInvoice.save();

      return res.status(200).json({
        success: true,
        msg: "Subheading updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
          success: false,
          msg: "Internal server error: " + error,
      });
    }
  }

  // Get a single invoice by id
  public static async getInvoiceById(req: Request, res: Response) {
    try {
      const { invoiceId } = req.params;

      const invoice = await InvoiceModel.findById(invoiceId)
        .populate("items")
        .populate("clientDetailId")
        .populate("recipientDetailId")
        .populate("bankDetailId");

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Calculate the subtotal
      const subTotal = invoice.items.reduce((total, item) => {
        // @ts-ignore
        return total + item.price * item.quantity;
      }, 0);

      // Calculate the total after applying discount, GST, and TDS
      const discountAmount = (subTotal * invoice.discount) / 100;
      const gstAmount = (subTotal * invoice.gst) / 100;
      const tdsAmount = (subTotal * invoice.tds) / 100;

      const totalAmount = subTotal - discountAmount + gstAmount - tdsAmount;

      const finalInvoice = {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.date,
        dueDate: invoice.dueDate,
        items: invoice.items,
        clientDetails: invoice.clientDetailId,
        recipientDetails: invoice.recipientDetailId,
        bankDetails: invoice.bankDetailId,
        note: invoice.note,
        discount: invoice.discount,
        gst: invoice.gst,
        tds: invoice.tds,
        subTotal: subTotal,
        totalAmount: totalAmount,
        subHeading: invoice.subHeading,
      };

      return res.status(200).json({ invoice: finalInvoice });
    } catch (error) {
      const err = error as Error;
      console.log(err);
      return res.status(500).json({
          success: false,
          msg: "Internal server error: " + error,
      });
    }
  }

  public static async getInvoiceStats(
    req: Request<{}, {}, GetInvoiceStatsRequest>,
    res: Response<GetInvoiceStatsResponse>
  ) {
    try {
      const { userId, timeFrame } = req.body;

      if (!userId || !timeFrame) {
        res.status(400).json({
          success: false,
          msg: "userId and timeFrame are required",
        });
        return;
      }

      // Determine the start date based on the timeframe
      let startDate: Date | null = null;
      const currentDate = new Date();

      switch (timeFrame.toLowerCase()) {
        case "week":
          startDate = new Date();
          startDate.setDate(currentDate.getDate() - 7);
          break;
        case "month":
          startDate = new Date();
          startDate.setMonth(currentDate.getMonth() - 1);
          break;
        case "year":
          startDate = new Date();
          startDate.setFullYear(currentDate.getFullYear() - 1);
          break;
        case "overall":
          startDate = null; // Include all invoices
          break;
        default:
          res.status(400).json({
            success: false,
            msg: "Invalid timeframe. Use 'overall', 'week', 'month', or 'year'.",
          });
          return;
      }

      // Fetch invoices for the user
      let invoices = await InvoiceModel.find({ userId });

      // Filter invoices by timeframe if startDate is defined
      if (startDate) {
        invoices = invoices.filter(
          (invoice) => new Date(invoice.createdAt) >= startDate
        );
      }

      // Filter paid invoices
      const paidInvoices = invoices.filter(
        (invoice) => invoice.status === "paid"
      );

      // Filter due invoices
      const dueInvoices = invoices.filter((invoice) => {
        const dueDate = new Date(invoice.dueDate);
        return currentDate > dueDate;
      });

      // Calculate outstanding amount
      let outStandingAmount = 0;
      let pendingAmount = 0;
      let paidAmount = 0;

      // Calculate outstanding amount for due invoices
      for (const invoice of dueInvoices) {
        for (const itemId of invoice.items) {
          const item = await ItemModel.findById(itemId);

          if (!item) {
            res.status(400).json({
              success: false,
              msg: `Item with ID ${itemId} not found`,
            });
            return;
          }

          outStandingAmount += item.quantity * item.price;
        }
      }

      // Calculate pending amount for non-overdue invoices
      for (const invoice of invoices) {
        const dueDate = new Date(invoice.dueDate);

        if (currentDate <= dueDate) {
          for (const itemId of invoice.items) {
            const item = await ItemModel.findById(itemId);

            if (!item) {
              res.status(400).json({
                success: false,
                msg: `Item with ID ${itemId} not found`,
              });
              return;
            }

            pendingAmount += item.quantity * item.price;
          }
        }
      }

      for (const invoice of paidInvoices) {
        const items = await ItemModel.find({ _id: { $in: invoice.items } });
        paidAmount += items.reduce((total, item) => {
          return total + item.quantity * item.price;
        }, 0);
      }

      // Calculate total amount for all invoices
      let totalAmount = 0;
      for (const invoice of invoices) {
        const items = await ItemModel.find({ _id: { $in: invoice.items } });
        totalAmount += items.reduce((total, item) => {
          return total + item.quantity * item.price;
        }, 0);
      }

      // Respond with the statistics
      res.status(200).json({
        success: true,
        data: {
          invoices: {
            created: invoices.length,
            paid: paidInvoices.length,
            due: dueInvoices.length,
          },
          outStandingAmount,
          pendingAmount,
          paidAmount,
          totalAmount,
          unpaidAmount: totalAmount - paidAmount,
        },
        msg: "Invoice stats fetched successfully",
      });
    } catch (error) {
      console.error("Error in getInvoiceStats:", error);
      res.status(500).json({
          success: false,
          msg: "Internal server error: " + error,
      });
    }
  }

  public static async markAsPaid(
    req: Request<{}, {}, { invoiceId: string; userId: string }>,
    res: Response<{ success: boolean; msg: string }>
  ) {
    try {
      const { invoiceId, userId } = req.body;

      const invoice = await InvoiceModel.findOne({
        _id: invoiceId,
        userId: userId,
      });

      if (!invoice) {
        return res.status(404).json({
          success: false,
          msg: "Invoice not found",
        });
      }

      invoice.status = InvoiceStatus.PAID;
      await invoice.save();

      return res.status(200).json({
        success: true,
        msg: "Invoice marked as paid",
      });
    } catch (error) {
      return res.status(500).json({
          success: false,
          msg: "Internal server error: " + error,
      });
    }
  }
}
