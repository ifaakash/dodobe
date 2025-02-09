import { Request, Response } from "express";
import { DodoPageModel, UserModel } from "../../models";
import { logger } from "../../utils/logger";
import { FileManager } from "../../utils/fileManager";
import {
    CreateDodoPageRequest,
    UpdateDodoPageRequest,
} from "../../types/dodoPage";
import { SocialPlatform } from "../../types/user";
import { ID } from "@/types/common";

export class DodoPageController {
    /**
     * Create a new DodoPage
     */
    public static async createDodoPage(
        req: Request<{}, {}, CreateDodoPageRequest>,
        res: Response
    ): Promise<void> {
        const { userId, name, thoughts } = req.body;
        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };

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
            console.log("req.body", req.body);

            const socialLinks = DodoPageController.parseSocialLinks(req.body);
            console.log("socialLinks", socialLinks);
            const dodoPage = await DodoPageModel.create({
                userId,
                name,
                url: await DodoPageController.generateUniqueUrl(name),
                socialLinks,
                thoughts,
                profilePicture: files?.profilePicture?.[0]?.path,
                audioBio: files?.audioBio?.[0]?.path,
            });

            user.dodoPages.push(dodoPage._id as ID);
            await user.save();

            // Convert Map back to object for response
            const socialLinksObject = Object.fromEntries(dodoPage.socialLinks);

            res.status(201).json({
                success: true,
                dodoPage: {
                    id: dodoPage._id as ID,
                    name: dodoPage.name,
                    url: dodoPage.url,
                    profilePicture: FileManager.getFileUrl(
                        dodoPage.profilePicture
                    ),
                    socialLinks: socialLinksObject,
                    thoughts: dodoPage.thoughts,
                    audioBio: FileManager.getFileUrl(dodoPage.audioBio),
                    blocks: dodoPage.blocks,
                },
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

    private static async generateUniqueUrl(name: string): Promise<string> {
        const baseUrl = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const url = `${baseUrl}-${randomSuffix}`;

        const existingPage = await DodoPageModel.findOne({ url });
        if (existingPage) {
            return this.generateUniqueUrl(name);
        }

        return url;
    }

    private static parseSocialLinks(body: any): Map<SocialPlatform, string> {
        // If socialLinks is passed directly in the body
        if (body.socialLinks && typeof body.socialLinks === "object") {
            return new Map(Object.entries(body.socialLinks)) as Map<
                SocialPlatform,
                string
            >;
        }

        // If socialLinks is passed as form fields (socialLinks[platform])
        const socialLinks = new Map<SocialPlatform, string>();
        Object.entries(body)
            .filter(([key]) => key.startsWith("socialLinks["))
            .forEach(([key, value]) => {
                const platform = key.match(
                    /socialLinks\[(.*?)\]/
                )?.[1] as SocialPlatform;
                if (platform && value) {
                    socialLinks.set(platform, value as string);
                }
            });
        return socialLinks;
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
        const { name, thoughts } = req.body;
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

            const newSocialLinks = DodoPageController.parseSocialLinks(
                req.body
            );

            // Update fields if provided
            if (name) dodoPage.name = name;
            if (thoughts) dodoPage.thoughts = thoughts;
            if (newSocialLinks.size > 0) {
                newSocialLinks.forEach((value, key) => {
                    dodoPage.socialLinks.set(key, value);
                });
            }

            // Handle file updates
            if (files?.profilePicture?.[0]) {
                await FileManager.deleteFile(dodoPage.profilePicture);
                dodoPage.profilePicture = files.profilePicture[0].path;
            }
            if (files?.audioBio?.[0]) {
                await FileManager.deleteFile(dodoPage.audioBio);
                dodoPage.audioBio = files.audioBio[0].path;
            }

            await dodoPage.save();

            // Convert Map back to object for response
            const socialLinksObject = Object.fromEntries(dodoPage.socialLinks);

            res.status(200).json({
                success: true,
                dodoPage: {
                    id: dodoPage._id as ID,
                    name: dodoPage.name,
                    url: dodoPage.url,
                    profilePicture: FileManager.getFileUrl(
                        dodoPage.profilePicture
                    ),
                    socialLinks: socialLinksObject,
                    thoughts: dodoPage.thoughts,
                    audioBio: FileManager.getFileUrl(dodoPage.audioBio),
                    blocks: dodoPage.blocks,
                },
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
