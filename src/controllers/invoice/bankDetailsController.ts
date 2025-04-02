import { Response, Request } from "express";
import { BankDetailModel } from "../../models/invoice/model";
import { UserModel } from "../../models/user/model";
import { IBankDetail, CreateBankDetailsRequest, CreateBankDetailsResponse } from "../../types/invoice";


export class BankDetailsController {
  public static async createBankDetails(
    req: Request<{}, {}, CreateBankDetailsRequest>,
    res: Response<CreateBankDetailsResponse>
  ) {
    try {
      const { userId } = req.body;
      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({ success: false, msg: "User not found" });
      }

      const bankDetails: IBankDetail = await BankDetailModel.create(req.body);

      user.bankDetails.push(bankDetails._id as any);
      await user.save();
      await bankDetails.save();

      return res
        .status(201)
        .json({ success: true, msg: "Bank Details Created", data: bankDetails });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, msg: (error as Error).message });
    }
  }

  public static async updateBankDetails(
    req: Request<{ id: string }, {}, CreateBankDetailsRequest>,
    res: Response<CreateBankDetailsResponse>
  ) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const bankDetails = await BankDetailModel.findById(id);
      if (!bankDetails) {
        return res.status(404).json({ success: false, msg: "Bank details not found" });
      }

      // Update the fields
      Object.assign(bankDetails, updateData);
      await bankDetails.save();

      return res
        .status(200)
        .json({ success: true, msg: "Bank details updated successfully", data: bankDetails });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, msg: (error as Error).message });
    }
  }

}