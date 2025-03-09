import { RecipientDetailModel } from "../../models/invoice/model";
import { Request, Response } from "express";
import { UserModel } from "../../models/user/model";
import {
  CreateRecipientResponse,
  GetRecipientsRequest,
  GetRecipientsResponse,
  UpdateRecipientRequest,
  UpdateRecipientResponse,
} from "@/types/invoice";
import { CreateRecipientRequest } from "@/types/invoice";

export class RecipientController {
  public static async createRecipient(
    req: Request<{}, {}, CreateRecipientRequest>,
    res: Response<CreateRecipientResponse>
  ) {
    try {
      const { userId } = req.body;
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          msg: "User not found",
        });
      }
      const recipient = await RecipientDetailModel.create(req.body);

      user.recipientDetails.push(recipient._id as any);
      await recipient.save();
      await user.save();

      return res
        .status(201)
        .json({ success: true, msg: "Recipient Created", data: recipient });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        msg: (error as Error).message,
      });
    }
  }

  public static async getRecipients(
    req: Request<{}, {}, GetRecipientsRequest>,
    res: Response<GetRecipientsResponse>
  ) {
    try {
      const { userId } = req.body;
      const recipients = await RecipientDetailModel.find({
        userId,
      });
      return res.status(200).json({
        success: true,
        msg: "Recipients Fetched",
        data: recipients,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        msg: (error as Error).message,
      });
    }
  }

  public static async updateRecipient(
    req: Request<{}, {}, UpdateRecipientRequest>,
    res: Response<UpdateRecipientResponse>
  ) {
    try {
      const { id } = req.body;

      const updatedRecipient = await RecipientDetailModel.findByIdAndUpdate(
        id,
        req.body,
        { new: true }
      );
      
      if (!updatedRecipient) {
        return res.status(404).json({
          success: false,
          msg: "Recipient not found",
        });
      }

      return res.status(200).json({ success: true, msg: "Recipient Updated" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        msg: (error as Error).message,
      });
    }
  }
}