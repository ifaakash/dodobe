import { Request, Response } from "express";
import { ClientDetailModel } from "../../models/invoice/model";
import { UserModel } from "../../models/user/model";
import {
  CreateClientRequest,
  CreateClientResponse,
  GetClientsRequest,
  GetClientsResponse,
} from "../../types/invoice";

export class ClientController {
  public static async createClient(
    req: Request<{}, {}, CreateClientRequest>,
    res: Response<CreateClientResponse>
  ) {
    try {
      const { userId } = req.body;
      const user = await UserModel.findById(userId);

      if (!user) {
        return res.status(404).json({ success: false, msg: "User not found" });
      }
      const client = await ClientDetailModel.create(req.body);

      user.clientDetails.push(client._id);
      await user.save();
      await client.save();

      return res
        .status(201)
        .json({ success: true, msg: "Client Created", data: client });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, msg: (error as Error).message });
    }
  }

  public static async getClients(
    req: Request<{}, {}, GetClientsRequest>,
    res: Response<GetClientsResponse>
  ) {
    try {
      const { userId } = req.body;

      const clients = await ClientDetailModel.find({ userId });

      return res
        .status(200)
        .json({ success: true, msg: "Clients Fetched", data: clients });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        msg: (error as Error).message,
      });
    }
  }
}