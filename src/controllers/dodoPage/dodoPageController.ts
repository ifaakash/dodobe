import { Request, Response } from "express";
import { DodoPageModel, UserModel } from "../../models";
import { logger } from "../../utils/logger";
import { FileManager } from "../../utils/fileManager";
import {
    CreateDodoPageRequest,
    UpdateDodoPageRequest,
} from "../../types/dodoPage";
import { Types } from "mongoose";

export class DodoPageController {
    /**
     * Create a new DodoPage
     */
    public static async createDodoPage(
        req: Request<{}, {}, CreateDodoPageRequest>,
        res: Response
    ): Promise<void> {
        const { userId, name, socialLinks, thoughts } = req.body;
        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };
        const uploadedFiles: string[] = [];

        try {
            const user = await UserModel.findById(userId);
            if (!user) {
                // Clean up any uploaded files
                if (files?.profilePicture?.[0]) {
                    await FileManager.deleteFile(files.profilePicture[0].path);
                }
                if (files?.audioBio?.[0]) {
                    await FileManager.deleteFile(files.audioBio[0].path);
                }

                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }

            const dodoPage = await DodoPageModel.create({
                userId,
                name,
                url: await this.generateUniqueUrl(name),
                socialLinks,
                thoughts,
                profilePicture: files?.profilePicture?.[0]?.path,
                audioBio: files?.audioBio?.[0]?.path,
            });

            user.dodoPages.push(dodoPage._id as Types.ObjectId);
            await user.save();

            res.status(201).json({
                success: true,
                dodoPage: {
                    id: dodoPage._id,
                    name: dodoPage.name,
                    url: dodoPage.url,
                    profilePicture: FileManager.getFileUrl(
                        dodoPage.profilePicture
                    ),
                    socialLinks: dodoPage.socialLinks,
                    thoughts: dodoPage.thoughts,
                    audioBio: FileManager.getFileUrl(dodoPage.audioBio),
                    blocks: dodoPage.blocks,
                },
                message: "DodoPage created successfully",
            });
        } catch (error) {
            // Clean up any uploaded files on error
            if (files?.profilePicture?.[0]) {
                await FileManager.deleteFile(files.profilePicture[0].path);
            }
            if (files?.audioBio?.[0]) {
                await FileManager.deleteFile(files.audioBio[0].path);
            }

            logger.error("Error in createDodoPage:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    private static async generateUniqueUrl(baseName: string): Promise<string> {
        const maxAttempts = 5;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const randomId = Math.random().toString(36).substring(2, 8);
            const url = `${baseName
                .toLowerCase()
                .replace(/\s+/g, "-")}-${randomId}`;

            const existingPage = await DodoPageModel.findOne({ url });
            if (!existingPage) {
                return url;
            }
            attempts++;
        }

        throw new Error("Unable to generate unique URL");
    }

    /**
     * Get DodoPage by URL
     */
    public static async getDodoPageByUrl(
        req: Request<{ url: string }>,
        res: Response
    ): Promise<void> {
        const { url } = req.params;

        try {
            const dodoPage = await DodoPageModel.findOne({ url });
            if (!dodoPage) {
                res.status(404).json({
                    success: false,
                    message: "DodoPage not found",
                });
                return;
            }

            res.status(200).json({
                success: true,
                dodoPage: {
                    id: dodoPage._id,
                    name: dodoPage.name,
                    url: dodoPage.url,
                    socialLinks: dodoPage.socialLinks,
                    thoughts: dodoPage.thoughts,
                    audioBio: dodoPage.audioBio,
                    blocks: dodoPage.blocks,
                },
            });
        } catch (error) {
            logger.error("Error in getDodoPageByUrl:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    /**
     * Update DodoPage
     */
    public static async updateDodoPage(
        req: Request<{ id: string }, {}, UpdateDodoPageRequest>,
        res: Response
    ): Promise<void> {
        const { id } = req.params;
        const updates = req.body;
        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };

        try {
            const dodoPage = await DodoPageModel.findById(id);
            if (!dodoPage) {
                res.status(404).json({
                    success: false,
                    message: "DodoPage not found",
                });
                return;
            }

            Object.assign(dodoPage, updates);

            if (files?.profilePicture?.[0]) {
                dodoPage.profilePicture = files.profilePicture[0].path;
            }
            if (files?.audioBio?.[0]) {
                dodoPage.audioBio = files.audioBio[0].path;
            }

            await dodoPage.save();

            res.status(200).json({
                success: true,
                dodoPage: {
                    id: dodoPage._id,
                    name: dodoPage.name,
                    url: dodoPage.url,
                    profilePicture: dodoPage.profilePicture,
                    socialLinks: dodoPage.socialLinks,
                    thoughts: dodoPage.thoughts,
                    audioBio: dodoPage.audioBio,
                    blocks: dodoPage.blocks,
                },
                message: "DodoPage updated successfully",
            });
        } catch (error) {
            logger.error("Error in updateDodoPage:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    /**
     * Get all DodoPages for a user
     */
    public static async getUserDodoPages(
        req: Request<{ userId: string }>,
        res: Response
    ): Promise<void> {
        const { userId } = req.params;

        try {
            const dodoPages = await DodoPageModel.find({ userId }).select(
                "_id name url profilePicture"
            );

            res.status(200).json({
                success: true,
                dodoPages: dodoPages.map((page) => ({
                    id: page._id,
                    name: page.name,
                    url: page.url,
                    profilePicture: page.profilePicture,
                })),
            });
        } catch (error) {
            logger.error("Error in getUserDodoPages:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    public static async deleteDodoPage(
        req: Request<{ pageId: string }>,
        res: Response
    ): Promise<void> {
        const { pageId } = req.params;

        try {
            const dodoPage = await DodoPageModel.findById(pageId);
            if (!dodoPage) {
                res.status(404).json({
                    success: false,
                    message: "DodoPage not found",
                });
                return;
            }

            // Delete associated files
            await FileManager.deleteFile(dodoPage.profilePicture);
            await FileManager.deleteFile(dodoPage.audioBio);

            // Remove reference from user
            await UserModel.updateOne(
                { _id: dodoPage.userId },
                { $pull: { dodoPages: pageId } }
            );

            await dodoPage.deleteOne();

            res.status(200).json({
                success: true,
                message: "DodoPage deleted successfully",
            });
        } catch (error) {
            logger.error("Error in deleteDodoPage:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    /**
     * Get DodoPage by ID
     */
    public static async getDodoPageById(
        req: Request<{ pageId: string }>,
        res: Response
    ): Promise<void> {
        const { pageId } = req.params;

        try {
            const dodoPage = await DodoPageModel.findById(pageId);
            if (!dodoPage) {
                res.status(404).json({
                    success: false,
                    message: "DodoPage not found",
                });
                return;
            }

            res.status(200).json({
                success: true,
                dodoPage: {
                    id: dodoPage._id,
                    name: dodoPage.name,
                    url: dodoPage.url,
                    profilePicture: FileManager.getFileUrl(
                        dodoPage.profilePicture
                    ),
                    socialLinks: dodoPage.socialLinks,
                    thoughts: dodoPage.thoughts,
                    audioBio: FileManager.getFileUrl(dodoPage.audioBio),
                    blocks: dodoPage.blocks,
                },
            });
        } catch (error) {
            logger.error("Error in getDodoPageById:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
}
