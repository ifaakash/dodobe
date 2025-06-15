import { Request, Response } from "express";
import { MediaKitModel } from "../../models/mediakit/model";
import mongoose from "mongoose";
import {
    VerifyRequestBody,
    VerifyResponse,
    CheckVerifiedRequestQuery,
    CheckVerifiedResponse,
    MediaKitDetailsResponse,
    BrandCollabResponse,
    UpdateMediaKitRequest,
    UpdateMediaKitResponse,
    CreateMediaKitRequest,
    CreateMediaKitResponse,
    AddBrandCollabRequestBody,
    LinkMediaKitRequestBody,
    LinkMediaKitResponse,
} from "../../types/mediakit";

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
                avgLikes,
                avgComments,
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

            // Update only the provided fields
            Object.assign(mediaKit, updates);
            await mediaKit.save();

            return res.status(200).json({
                success: true,
                message: "MediaKit updated successfully",
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
        const { instaId, brandCollab } = req.body;

        if (!instaId || !brandCollab) {
            return res.status(400).json({
                success: false,
                message: "instaId and brandCollab are required",
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
            mediaKit.brandCollabs.push(brandCollab);
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
                mediaKit.userId = userObjectId;
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
}
