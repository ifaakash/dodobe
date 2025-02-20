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

      const bankDetails:IBankDetail = await BankDetailModel.create(req.body);

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
}