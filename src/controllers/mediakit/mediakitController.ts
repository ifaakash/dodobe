import { Request, Response } from "express";
import { MediaKitModel } from "../../models/mediakit/model";
import mongoose from "mongoose";
import { uploadToS3 } from "../../middleware/fileUpload";
import {
    VerifyRequestBody,
    VerifyResponse,
    CheckVerifiedResponse,
    MediaKitDetailsResponse,
    BrandCollabResponse,
    UploadAnalyticsRequest,
    UploadAnalyticsResponse,
    UpdateMediaKitRequest,
    UpdateMediaKitResponse,
    CreateMediaKitRequest,
    CreateMediaKitResponse,
    AddBrandCollabRequestBody,
    LinkMediaKitRequestBody,
    LinkMediaKitResponse,
} from "../../types/mediakit";
import { UserModel } from "../../models/user/model";
import {
    AgeAnalyticsSchema,
    ContentAnalyticsSchema,
    GenderAnalyticsSchema,
} from "../../models/mediakit/schema";
import { GeminiService } from "../../utils/geminiService";
import { logger } from "../../utils/logger";

export class MediaKitController {
    // POST /verify
    public static async verify(
        req: Request<{}, {}, VerifyRequestBody>,
        res: Response<VerifyResponse>
    ) {
        const { instaId, userId } = req.body;

        if (!instaId || !userId) {
            return res.status(400).json({
                success: false,
                message: "Both instaId and userId are required",
            });
        }

        try {
            await MediaKitModel.findOneAndUpdate(
                { instaId },
                { userId },
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

    // GET /is-verified/some_id
    public static async checkVerified(
        req: Request<{ instaId: string }>,
        res: Response<CheckVerifiedResponse>
    ) {
        const { instaId } = req.params;

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

    // GET /get-by-instaId/some_id
    public static async getDetailsByInstaId(
        req: Request<{ instaId: string }>,
        res: Response<MediaKitDetailsResponse>
    ) {
        const { instaId } = req.params;

        if (!instaId) {
            return res.status(400).json({
                success: false,
                message: "instaId is required and must be a string",
            });
        }

        try {
            const mediaKit = await MediaKitModel.findOne({ instaId });

            const user = await UserModel.findById(mediaKit?.userId);

            console.log(user);

            if (!mediaKit) {
                return res.status(404).json({
                    success: false,
                    message: "MediaKit not found for this instaId",
                });
            }
            return res.status(200).json({
                success: true,
                data: mediaKit,
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

    // POST /create
    public static async createMediaKit(
        req: Request<{}, {}, CreateMediaKitRequest>,
        res: Response<CreateMediaKitResponse>
    ) {
        const {
            instaId,
            followers,
            avgLikes,
            avgComments,
            mediaCount,
            following,
            isVerified,
        } = req.body;

        if (!instaId || !followers || !avgLikes || !avgComments) {
            return res.status(400).json({
                success: false,
                message: "instaId is required",
            });
        }

        try {
            // Check if a media kit already exists for this instaId
            const existingMediaKit = await MediaKitModel.findOne({ instaId });
            if (existingMediaKit) {
                return res.status(409).json({
                    success: false,
                    message: "MediaKit already exists for this instaId",
                });
            }
            const engagementRate =
                followers > 0
                    ? ((Number(avgLikes) + Number(avgComments)) /
                          Number(followers)) *
                      100
                    : 0;
            const verified = isVerified || false;

            // Create new media kit
            const mediaKit = await MediaKitModel.create({
                instaId,
                isVerified: verified,
                followers,
                following,
                mediaCount,
                engagement: engagementRate,
                contentAnalytics: {
                    contentData: {
                        avgLikes,
                        avgComments,
                        mediaCount,
                    },
                    uploadedAt: new Date(),
                },
            });

            return res.status(201).json({
                success: true,
                message: "MediaKit created successfully",
                data: mediaKit,
            });
        } catch (error) {
            console.error("Error creating MediaKit:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: (error as Error).message,
            });
        }
    }

    // Patch /update
    public static async updateMediaKit(
        req: Request<{}, {}, UpdateMediaKitRequest>,
        res: Response<UpdateMediaKitResponse>
    ) {
        const { instaId, updates } = req.body;

        if (!instaId) {
            return res.status(400).json({
                success: false,
                message: "instaId is required",
            });
        }

        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No updates provided",
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

            // Update the provided fields
            Object.assign(mediaKit, updates);
            await mediaKit.save();

            return res.status(200).json({
                success: true,
                message: "MediaKit updated successfully",
                data: mediaKit,
            });
        } catch (error) {
            console.error("Error updating MediaKit:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: (error as Error).message,
            });
        }
    }

    /*
    @desc Add a brand collaboration to the media kit
    @route POST /add-brand-collab
    @access Authenticated
    @dev only one brand collab is allowed per request, but multiple brand collabs can be added to the media kit
    */
    public static async addBrandCollab(
        req: Request<{}, {}, AddBrandCollabRequestBody>,
        res: Response<BrandCollabResponse>
    ) {
        const {
            instaId,
            brandName,
            contentType,
            contentUrl,
            reach,
            engagement,
        } = req.body;
        const brandLogo = req.file;

        if (!instaId || !brandName || !contentType) {
            return res.status(400).json({
                success: false,
                message: "instaId, brandName, and contentType are required",
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

            let brandLogoUrl;
            if (brandLogo) {
                brandLogoUrl = await uploadToS3(brandLogo, "brand-logos");
            }

            const brandCollab = {
                brandName,
                contentType,
                contentUrl,
                reach,
                engagement,
                brandLogo: brandLogoUrl,
                isActive: true,
            };

            mediaKit.brandCollabs = mediaKit.brandCollabs || [];
            mediaKit.brandCollabs.push(brandCollab);
            await mediaKit.save();
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

    /*
    @desc Link media kit to a user
    @route POST /link-mediakit-to-user
    @access Authenticated
    @dev only one media kit can be linked to a user, if a user already has a media kit, it won't be updated
    */
    public static async linkMediaKit(
        req: Request<{}, {}, LinkMediaKitRequestBody>,
        res: Response<LinkMediaKitResponse>
    ) {
        const { userId, instaId } = req.body;

        if (!userId || !instaId) {
            return res.status(400).json({
                success: false,
                message: "Both userId and instaId are required",
            });
        }

        try {
            // Convert string userId to ObjectId
            const userObjectId = new mongoose.Types.ObjectId(userId);

            // Check if user already has a media kit
            const existingUserMediaKit = await MediaKitModel.findOne({
                userId: userObjectId,
            });
            if (existingUserMediaKit) {
                return res.status(409).json({
                    success: false,
                    message: "User already has a linked media kit",
                    data: existingUserMediaKit,
                });
            }

            // Check if media kit exists
            let mediaKit = await MediaKitModel.findOne({ instaId });

            if (!mediaKit) {
                // Create new media kit with default values and link it to the user
                const newMediaKit = await MediaKitModel.create({
                    instaId,
                    userId: userObjectId,
                    isVerified: false,
                    followers: 0,
                    following: 0,
                    mediaCount: 0,
                    engagement: 0,
                    avgLikes: 0,
                    avgComments: 0,
                    brandCollabs: [],
                });
                mediaKit = newMediaKit;
            } else if (mediaKit.userId) {
                // If media kit exists and is already linked to another user
                return res.status(409).json({
                    success: false,
                    message: "MediaKit is already linked to another user",
                    data: mediaKit,
                });
            } else {
                // If media kit exists but is not linked to any user
                const user = await UserModel.findById(userObjectId);
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: "User not found",
                    });
                }

                user.mediaKit = mediaKit._id;
                mediaKit.userId = userObjectId;
                await user.save();
                await mediaKit.save();
            }

            return res.status(200).json({
                success: true,
                message: "MediaKit linked to user successfully",
                data: mediaKit,
            });
        } catch (error) {
            console.error("Error linking media kit:", error);
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

        if (!instaId || !type) {
            return res.status(400).json({
                success: false,
                message: "instaId and type are required",
            });
        }

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
            // 0. Check if media kit exists
            const mediaKit = await MediaKitModel.findOne({ instaId });
            if (!mediaKit) {
                return res.status(404).json({
                    success: false,
                    message: "MediaKit not found for this instaId",
                });
            }

            // 1. Convert file to base64
            const imageBase64 = file.buffer.toString("base64");

            // 2. Extract data using Gemini
            const analyticsData = await GeminiService.extractAnalytics(
                imageBase64,
                type
            );

            // 3. Check if Gemini detected invalid screenshot
            if (analyticsData.error) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid screenshot: The uploaded image does not contain ${type} analytics data. Please upload a valid Instagram ${type} analytics screenshot.`,
                    error: analyticsData.error,
                });
            }

            // 4. Completely replace the analytics data (not merge)
            switch (type) {
                case "content":
                    // Replace entire content analytics object
                    mediaKit.contentAnalytics = {
                        contentData: analyticsData,
                        uploadedAt: new Date(),
                    };
                    break;
                case "gender":
                    // Replace entire gender analytics object
                    mediaKit.genderAnalytics = {
                        genderData: analyticsData,
                        uploadedAt: new Date(),
                        isActive: true,
                    };
                    break;
                case "age":
                    // Replace entire age analytics object (clears old age groups)
                    mediaKit.ageAnalytics = {
                        ageData: analyticsData,
                        uploadedAt: new Date(),
                        isActive: true,
                    };
                    break;
                case "location":
                    // Replace entire location analytics object (clears old locations)
                    mediaKit.locationAnalytics = {
                        locationData: analyticsData,
                        uploadedAt: new Date(),
                        isActive: true,
                    };
                    break;
            }

            // Mark nested paths as modified to ensure proper replacement of Map data
            if (type === "age") {
                mediaKit.markModified("ageAnalytics.ageData.ageGroups");
            } else if (type === "location") {
                mediaKit.markModified(
                    "locationAnalytics.locationData.locations"
                );
            }

            await mediaKit.save();

            // 6. Return full updated mediakit data
            return res.status(200).json({
                success: true,
                message: "Analytics uploaded successfully",
                data: mediaKit,
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
