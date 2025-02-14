import { Request, Response } from "express";
import {
    UserModel,
    DodoPageModel,
    UserInterestCategoryModel,
} from "../../models";
import { logger } from "../../utils/logger";
import {
    CompleteProfileRequest,
    GetUserDetailsRequest,
    GetUserDetailsResponse,
    RegisterRequest,
    RegisterResponse,
    UpdateUserDetailsResponseError,
} from "../../types/auth";
import mongoose from "mongoose";
import { Types } from "mongoose";
import { IUserInterestCategory, IDodoPage } from "../../types/user";
import { FileManager } from "../../utils/fileManager";

export class AuthController {
    /**
     * Register user after OTPless login
     */
    public static async registerUser(
        req: Request<{}, {}, RegisterRequest>,
        res: Response<RegisterResponse>
    ): Promise<void> {
        const { mobileNumber, otplessId, token } = req.body;

        try {
            // Check if user already exists with otplessId
            const existingUser = await UserModel.findOne({ otplessId });

            if (existingUser) {
                res.status(200).json({
                    success: true,
                    message: "User already exists",
                    userId: existingUser._id as Types.ObjectId,
                    isNewUser: false,
                    token,
                });
                return;
            }

            // Create new user if doesn't exist
            const newUser = await UserModel.create({
                mobileNumber,
                otplessId,
            });

            res.status(201).json({
                success: true,
                message: "User registered successfully",
                userId: newUser._id as Types.ObjectId,
                isNewUser: true,
                token: token,
            });
        } catch (error) {
            logger.error("Error in registerUser:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                userId: new Types.ObjectId(),
                isNewUser: false,
                token: "",
            });
        }
    }

    /**
     * Complete user profile and create default DodoPage
     */
    public static async completeProfile(
        req: Request<{}, {}, CompleteProfileRequest>,
        res: Response
    ): Promise<void> {
        const { userId, name, interests, socialLinks } = req.body;

        try {
            const user = await UserModel.findById(userId);

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }

            user.name = name;

            const interestCategories = (await Promise.all(
                interests.map((category: string) =>
                    UserInterestCategoryModel.create({
                        userId,
                        category,
                    })
                )
            )) as IUserInterestCategory[];

            user.interestCategories = interestCategories.map(
                (ic) => ic._id as Types.ObjectId
            );

            // Generate unique URL for DodoPage
            const generateUniqueUrl = async (
                baseName: string
            ): Promise<string> => {
                const randomId: string = Math.random()
                    .toString(36)
                    .substring(2, 8);
                const url: string = `${baseName
                    .toLowerCase()
                    .replace(/\s+/g, "-")}-${randomId}`;

                const existingPage = await DodoPageModel.findOne({ url });
                if (existingPage) {
                    return generateUniqueUrl(baseName);
                }
                return url;
            };

            // Create default DodoPage for the first time user
            const dodoPage = (await DodoPageModel.create({
                userId,
                name,
                url: await generateUniqueUrl(name),
                socialLinks,
            })) as IDodoPage;

            user.dodoPages = [dodoPage._id as Types.ObjectId];
            await user.save();

            res.status(200).json({
                success: true,
                userId: user._id,
                dodoPageId: dodoPage._id,
                dodoPageUrl: dodoPage.url,
                message: "Profile completed and DodoPage created successfully",
            });
        } catch (error) {
            logger.error("Error in completeProfile:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }

    public static async getUserDetails(
        req: Request<GetUserDetailsRequest>,
        res: Response<GetUserDetailsResponse | UpdateUserDetailsResponseError>
    ): Promise<void> {
        const { userId } = req.params;

        try {
            // Validate if userId is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid user ID format",
                });
                return;
            }

            const user = await UserModel.findById(userId)
                .populate<{ dodoPages: IDodoPage[] }>({
                    path: "dodoPages",
                    select: "_id name url profilePicture",
                })
                .populate<{ interestCategories: IUserInterestCategory[] }>({
                    path: "interestCategories",
                    select: "category",
                });

            if (!user) {
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }

            res.status(200).json({
                success: true,
                user: {
                    id: user._id as any,
                    otplessId: user.otplessId,
                    name: user.name,
                    mobileNumber: user.mobileNumber,
                    interestCategories: user.interestCategories.map(
                        (ic: IUserInterestCategory) => ic.category
                    ),
                    dodoPages: user.dodoPages.map((page) => ({
                        id: page._id,
                        name: page.name,
                        url: page.url,
                        profilePicture: page.profilePicture
                            ? FileManager.getFileUrl(page.profilePicture)
                            : "",
                    })) as any,
                    bankDetails: user.bankDetails,
                    invoices: user.invoices,
                    clientDetails: user.clientDetails,
                    recipientDetails: user.recipientDetails,
                },
            });
        } catch (error) {
            logger.error("Error in getUserDetails:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    // public static async updateUserDetails(
    //     req: Request<UpdateUserDetailsRequest>,
    //     res: Response
    // ): Promise<void> {
    //     const { userId, name, interests } = req.body;
    // }
}
