import { Request, Response } from "express";
import { MediaKitModel } from "../../models/mediakit/model";

export const MediaKitController = {
  // POST /verify
  async verify(req: Request, res: Response) {
    const { instaId, link } = req.body;

    if (!instaId || !link) {
      return res.status(400).json({
        success: false,
        message: "Both instaId and link are required",
      });
    }

    try {
      await MediaKitModel.findOneAndUpdate(
        { instaId },
        { instaId, link },
        { upsert: true, new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Verification data saved successfully",
      });
    } catch (error) {
      console.error("Error saving verification data:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  // GET /isverified?instaId=some_id
  async checkVerified(req: Request, res: Response) {
    const { instaId } = req.query;

    if (!instaId || typeof instaId !== "string") {
      return res.status(400).json({
        success: false,
        message: "instaId is required and must be a string",
      });
    }

    try {
      const mediaKit = await MediaKitModel.findOne({ instaId });

      if (!mediaKit) {
        return res.status(404).json({
          success: false,
          message: "MediaKit not found for this instaId",
        });
      }

      return res.status(200).json({
        success: true,
        isVerified: mediaKit.isVerified,
      });
    } catch (error) {
      console.error("Error checking verification:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  },

  async details(req: Request, res: Response) {
    const { instaId } = req.query;
  
    if (!instaId || typeof instaId !== "string") {
      return res.status(400).json({
        success: false,
        message: "instaId is required and must be a string",
      });
    }
  
    try {
      const mediaKit = await MediaKitModel.findOne({ instaId });
  
      if (!mediaKit) {
        return res.status(404).json({
          success: false,
          message: "MediaKit not found for this instaId",
        });
      }
  
      return res.status(200).json({
        success: true,
        data: {
          instaId: mediaKit.instaId,
          linkUrl: mediaKit.linkUrl,
          isVerified: mediaKit.isVerified,
          follower: mediaKit.follower,
          following: mediaKit.following,
          mediaCount: mediaKit.mediaCount,
          engagement: mediaKit.engagement,
          avgLikes: mediaKit.avgLikes,
          avgComments: mediaKit.avgComments,
        },
      });
    } catch (error) {
      console.error("Error fetching details:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
};
