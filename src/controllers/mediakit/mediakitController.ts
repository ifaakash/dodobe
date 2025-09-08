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
    UpdateBrandCollabRequestBody,
    UpdateBrandCollabResponse,
    DeleteBrandCollabRequestBody,
    DeleteBrandCollabResponse,
    LinkMediaKitRequestBody,
    LinkMediaKitResponse,
    JoinWaitlistRequestBody,
    JoinWaitlistResponse,
    IMediaKit,
} from "../../types/mediakit";
import { UserModel } from "../../models/user/model";
import { GeminiService } from "../../utils/geminiService";
import { logger } from "../../utils/logger";
import { IDodoPage, IUserInterestCategory } from "../../types/user";
import { emailService } from "../../utils/emailService";

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
            // Ensure first character of instaId is lowercase
            const normalizedInstaId =
                instaId.charAt(0).toLowerCase() + instaId.slice(1);

            await MediaKitModel.findOneAndUpdate(
                { instaId: normalizedInstaId },
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

            const user = await UserModel.findById(mediaKit?.userId).populate<{
                dodoPages: IDodoPage[];
                interestCategories: IUserInterestCategory[];
            }>("dodoPages interestCategories");

            const mediaKitData = mediaKit.toObject();
            const userInterestCategories =
                user?.interestCategories?.map((id) => id.category) || [];

            // Convert Map data structures to regular objects
            if (mediaKitData.ageAnalytics?.ageData?.ageGroups instanceof Map) {
                mediaKitData.ageAnalytics.ageData.ageGroups =
                    Object.fromEntries(
                        mediaKitData.ageAnalytics.ageData.ageGroups
                    );
            }
            if (
                mediaKitData.locationAnalytics?.locationData
                    ?.locations instanceof Map
            ) {
                mediaKitData.locationAnalytics.locationData.locations =
                    Object.fromEntries(
                        mediaKitData.locationAnalytics.locationData.locations
                    );
            }

            // Always ensure user object exists with default values
            mediaKitData.user = {
                name: user?.name || null,
                profilePicture: user?.dodoPages?.[0]?.profilePicture || null,
                interestCategories: userInterestCategories,
            };

            return res.status(200).json({
                success: true,
                data: mediaKitData,
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
            mediaCount,
            avgLikes,
            avgComments,
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
            // Ensure first character of instaId is lowercase
            const normalizedInstaId =
                instaId.charAt(0).toLowerCase() + instaId.slice(1);

            // Check if a media kit already exists for this instaId
            const existingMediaKit = await MediaKitModel.findOne({
                instaId: normalizedInstaId,
            });
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
                instaId: normalizedInstaId,
                isVerified: verified,
                followers,
                following,
                avgLikes,
                avgComments,
                mediaCount,
                engagement: engagementRate,
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
        const mediaKitProfileImage = req.file;

        // Handle form-urlencoded data by extracting individual fields
        let actualUpdates: any = {};

        if (updates && typeof updates === "object") {
            // JSON format with updates object
            actualUpdates = updates;
        } else {
            // Form-urlencoded format - extract individual fields from req.body
            const {
                instaId: _, // exclude instaId from updates
                updates: __, // exclude updates from updates
                ...bodyFields
            } = req.body as any;

            // Only include defined fields (not undefined or null)
            Object.keys(bodyFields).forEach((key) => {
                if (
                    bodyFields[key] !== undefined &&
                    bodyFields[key] !== null &&
                    bodyFields[key] !== ""
                ) {
                    // Convert string numbers to actual numbers for numeric fields
                    if (
                        [
                            "followers",
                            "following",
                            "mediaCount",
                            "avgLikes",
                            "avgComments",
                        ].includes(key)
                    ) {
                        actualUpdates[key] = Number(bodyFields[key]);
                    } else if (key === "isVerified") {
                        // Convert string boolean to actual boolean
                        actualUpdates[key] =
                            bodyFields[key] === "true" ||
                            bodyFields[key] === true;
                    } else {
                        actualUpdates[key] = bodyFields[key];
                    }
                }
            });
        }

        if (!instaId) {
            return res.status(400).json({
                success: false,
                message: "instaId is required",
            });
        }

        // Allow updates if either actualUpdates has fields OR a profile image is provided
        if (
            (!actualUpdates || Object.keys(actualUpdates).length === 0) &&
            !mediaKitProfileImage
        ) {
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

            if (mediaKitProfileImage) {
                const mediaKitProfileImageUrl = await uploadToS3(
                    mediaKitProfileImage,
                    "media-kit-profile-images"
                );
                mediaKit.mediaKitProfileImage = mediaKitProfileImageUrl;
            }

            // Calculate engagement rate if all required fields are provided
            const hasFollowers =
                "followers" in actualUpdates || mediaKit.followers;
            const hasAvgLikes =
                "avgLikes" in actualUpdates || mediaKit.avgLikes;
            const hasAvgComments =
                "avgComments" in actualUpdates || mediaKit.avgComments;

            if (hasFollowers && hasAvgLikes && hasAvgComments) {
                const followers = actualUpdates.followers ?? mediaKit.followers;
                const avgLikes = actualUpdates.avgLikes ?? mediaKit.avgLikes;
                const avgComments =
                    actualUpdates.avgComments ?? mediaKit.avgComments;

                if (followers > 0) {
                    const engagementRate =
                        ((Number(avgLikes) + Number(avgComments)) /
                            Number(followers)) *
                        100;
                    actualUpdates.engagement = engagementRate;
                }
            }

            // Update the provided fields
            Object.assign(mediaKit, actualUpdates);
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

            mediaKit.brandCollabs = mediaKit.brandCollabs || {
                isActive: true,
                brands: [],
            };

            if (mediaKit.brandCollabs.brands.length < 1) {
                mediaKit.brandCollabs.isActive = true;
            }
            mediaKit.brandCollabs.brands.push(brandCollab);
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

    public static async updateBrandCollab(
        req: Request<{}, {}, UpdateBrandCollabRequestBody>,
        res: Response<UpdateBrandCollabResponse>
    ) {
        const { instaId, brandId, updates } = req.body;

        if (!instaId || !brandId) {
            return res.status(400).json({
                success: false,
                message: "instaId and brandId are required",
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

            if (!mediaKit.brandCollabs || !mediaKit.brandCollabs.brands) {
                return res.status(404).json({
                    success: false,
                    message: "No brand collaborations found for this MediaKit",
                });
            }

            // Find the brand collaboration by brandId
            const brandIndex = mediaKit.brandCollabs.brands.findIndex(
                (brand) => brand._id?.toString() === brandId
            );

            if (brandIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: "Brand collaboration not found",
                });
            }

            // Update the brand collaboration
            Object.assign(mediaKit.brandCollabs.brands[brandIndex], {
                ...updates,
                updatedAt: new Date(),
            });

            await mediaKit.save();

            return res.status(200).json({
                success: true,
                message: "Brand collaboration updated successfully",
                data: mediaKit,
            });
        } catch (error) {
            console.error("Error updating brand collaboration:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: (error as Error).message,
            });
        }
    }

    /*
    @desc Delete a brand collaboration from the media kit
    @route DELETE /delete-brand-collab
    @access Authenticated
    */
    public static async deleteBrandCollab(
        req: Request<{}, {}, DeleteBrandCollabRequestBody>,
        res: Response<DeleteBrandCollabResponse>
    ) {
        const { instaId, brandId } = req.body;

        if (!instaId || !brandId) {
            return res.status(400).json({
                success: false,
                message: "instaId and brandId are required",
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

            if (!mediaKit.brandCollabs || !mediaKit.brandCollabs.brands) {
                return res.status(404).json({
                    success: false,
                    message: "No brand collaborations found for this MediaKit",
                });
            }

            // Find the brand collaboration by brandId
            const brandIndex = mediaKit.brandCollabs.brands.findIndex(
                (brand) => brand._id?.toString() === brandId
            );

            if (brandIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: "Brand collaboration not found",
                });
            }

            // Remove the brand collaboration
            mediaKit.brandCollabs.brands.splice(brandIndex, 1);

            // If no brands left, set brandCollabs to inactive
            if (mediaKit.brandCollabs.brands.length === 0) {
                mediaKit.brandCollabs.isActive = false;
            }

            await mediaKit.save();

            return res.status(200).json({
                success: true,
                message: "Brand collaboration deleted successfully",
                data: mediaKit,
            });
        } catch (error) {
            console.error("Error deleting brand collaboration:", error);
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

    /*
    @desc Join waitlist for media kit creation
    @route POST /join-waitlist
    @access Authenticated
    @dev Creates a pending mediakit with queue number for manual processing
    */
    public static async joinWaitlist(
        req: Request<{}, {}, JoinWaitlistRequestBody>,
        res: Response<JoinWaitlistResponse>
    ) {
        const { userId, instaId } = req.body;

        if (!userId || !instaId) {
            return res.status(400).json({
                success: false,
                message: "Both userId and instaId are required",
            });
        }

        try {
            // Ensure first character of instaId is lowercase
            const normalizedInstaId =
                instaId.charAt(0).toLowerCase() + instaId.slice(1);

            // Convert string userId to ObjectId
            const userObjectId = new mongoose.Types.ObjectId(userId);

            // Check if user already has a media kit
            const existingUserMediaKit = await MediaKitModel.findOne({
                userId: userObjectId,
            });
            if (existingUserMediaKit) {
                return res.status(409).json({
                    success: false,
                    message: "User already has a media kit or is in waitlist",
                });
            }

            // Check if instaId already exists
            const existingMediaKit = await MediaKitModel.findOne({
                instaId: normalizedInstaId,
            });
            if (existingMediaKit) {
                return res.status(409).json({
                    success: false,
                    message: "MediaKit with this instaId already exists",
                });
            }

            // Check if user exists
            const user = await UserModel.findById(userObjectId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            // Generate random queue number between 400-500
            const queueNumber =
                Math.floor(Math.random() * (500 - 400 + 1)) + 400;
            const createdAt = new Date();

            // Create new media kit with default values and waitlist data
            const mediaKit = await MediaKitModel.create({
                instaId: normalizedInstaId,
                userId: userObjectId,
                isVerified: false,
                followers: 0,
                following: 0,
                mediaCount: 0,
                engagement: 0,
                avgLikes: 0,
                avgComments: 0,
                queueNumber,
                waitlistCreatedAt: createdAt,
                brandCollabs: {
                    isActive: false,
                    brands: [],
                },
            });

            // Link media kit to user
            user.mediaKit = mediaKit._id;
            await user.save();

            // Send notification email to admin team
            try {
                await emailService.notifyAdminNewWaitlistRequest({
                    instaId: normalizedInstaId,
                    userName: user.name || undefined,
                    userEmail: user.email || undefined,
                    userId: userId,
                    mediaKitId: mediaKit._id.toString(),
                    queueNumber,
                    createdAt,
                });
                logger.info(
                    `Waitlist notification email sent for ${normalizedInstaId}`
                );
            } catch (emailError) {
                // Log email error but don't fail the request
                logger.error(
                    "Failed to send waitlist notification email:",
                    emailError
                );
            }

            return res.status(201).json({
                success: true,
                message:
                    "Successfully joined the waitlist! You will be notified once your media kit is ready.",
                queueNumber,
                createdAt,
            });
        } catch (error) {
            console.error("Error joining waitlist:", error);
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
