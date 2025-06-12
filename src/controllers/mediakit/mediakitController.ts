import { Request, Response } from "express";
import { MediaKitModel } from "../../models/mediakit/model";
import {
    VerifyRequestBody,
    VerifyResponse,
    CheckVerifiedRequestQuery,
    CheckVerifiedResponse,
    MediaKitDetailsResponse,
    BrandCollabRequestBody,
    BrandCollabResponse,
    UploadAnalyticsRequest,
    UploadAnalyticsResponse,
} from "../../types/mediakit";
import { GeminiService } from "../../utils/geminiService";
import { logger } from "../../utils/logger";

export class MediaKitController {
    // POST /verify
    public static async verify(
        req: Request<{}, {}, VerifyRequestBody>,
        res: Response<VerifyResponse>
    ) {
        const { instaId, linkUrl } = req.body;

        if (!instaId || !linkUrl) {
            return res.status(400).json({
                success: false,
                message: "Both instaId and link are required",
            });
        }

        try {
            await MediaKitModel.findOneAndUpdate(
                { instaId },
                { linkUrl },
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
                error: (error as Error).message,
            });
        }
    }

    // GET /isverified?instaId=some_id
    public static async checkVerified(
        req: Request<{}, {}, {}, CheckVerifiedRequestQuery>,
        res: Response<CheckVerifiedResponse>
    ) {
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
                error: (error as Error).message,
            });
        }
    }

    // GET /details?instaId=some_id
    public static async details(
        req: Request<{}, {}, {}, CheckVerifiedRequestQuery>,
        res: Response<MediaKitDetailsResponse>
    ) {
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

            console.log(mediaKit);
            return res.status(200).json({
                success: true,
                data: {
                    instaId: mediaKit.instaId,
                    linkUrl: mediaKit.linkUrl,
                    isVerified: mediaKit.isVerified,
                    followers: mediaKit.followers,
                    following: mediaKit.following,
                    mediaCount: mediaKit.mediaCount,
                    engagement: mediaKit.engagement,
                    avgLikes: mediaKit.avgLikes,
                    avgComments: mediaKit.avgComments,
                    brandCollabs: mediaKit.brandCollabs,
                },
            });
        } catch (error) {
            console.error("Error fetching details:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: (error as Error).message,
            });
        }
    }

    // POST /brand-collab
    public static async addBrandCollab(
        req: Request<{}, {}, BrandCollabRequestBody>,
        res: Response<BrandCollabResponse>
    ) {
        const { instaId, brandName, brandLogo, type, reach, engagement } =
            req.body;

        if (
            !instaId ||
            !brandName ||
            !brandLogo ||
            !type ||
            !reach ||
            !engagement
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
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

            mediaKit.brandCollabs = mediaKit.brandCollabs || [];
            mediaKit.brandCollabs.push({
                brandName,
                brandLogo,
                type,
                reach,
                engagement,
            });

            await mediaKit.save();

            return res.status(200).json({
                success: true,
                message: "Brand collaboration added successfully",
            });
        } catch (error) {
            console.error("Error adding brand collaboration:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: (error as Error).message,
            });
        }
    }

    // POST /analytics
    public static async uploadAnalytics(
        req: Request<{}, {}, UploadAnalyticsRequest>,
        res: Response<UploadAnalyticsResponse>
    ) {
        const { instaId, type } = req.body;
        const file = (
            req.files as { [fieldname: string]: Express.Multer.File[] }
        )?.["screenshot"]?.[0];

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Screenshot file is required",
            });
        }

        try {
            // 1. Convert file to base64
            const imageBase64 = file.buffer.toString("base64");

            // 2. Extract data using Gemini
            const analyticsData = await GeminiService.extractAnalytics(
                imageBase64,
                type
            );

            // 3. Update MediaKit document
            const mediaKit = await MediaKitModel.findOne({ instaId });
            if (!mediaKit) {
                return res.status(404).json({
                    success: false,
                    message: "MediaKit not found",
                });
            }

            // 4. Update the specific analytics type with upload date
            const updateData = {
                ...analyticsData,
                uploadedAt: new Date(),
            };

            switch (type) {
                case "content":
                    mediaKit.contentAnalytics = updateData;
                    break;
                case "gender":
                    mediaKit.genderAnalytics = updateData;
                    break;
                case "age":
                    mediaKit.ageAnalytics = updateData;
                    break;
                case "location":
                    mediaKit.locationAnalytics = updateData;
                    break;
            }

            await mediaKit.save();

            // 5. Return full updated mediakit data
            return res.status(200).json({
                success: true,
                data: {
                    instaId: mediaKit.instaId,
                    // ... include all mediakit fields
                    contentAnalytics: mediaKit.contentAnalytics,
                    genderAnalytics: mediaKit.genderAnalytics,
                    ageAnalytics: mediaKit.ageAnalytics,
                    locationAnalytics: mediaKit.locationAnalytics,
                },
            });
        } catch (error) {
            logger.error("Error processing analytics:", error);
            return res.status(500).json({
                success: false,
                message: "Error processing analytics",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}
