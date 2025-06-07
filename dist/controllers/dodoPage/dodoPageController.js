"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DodoPageController = void 0;
const models_1 = require("../../models");
const logger_1 = require("../../utils/logger");
const fileManager_1 = require("../../utils/fileManager");
const block_1 = require("../../types/block");
const fileUpload_1 = require("../../middleware/fileUpload");
class DodoPageController {
    /**
     * Create a new DodoPage
     */
    static async createDodoPage(req, res) {
        const { userId, name, thoughts } = req.body;
        const files = req.files;
        try {
            const user = await models_1.UserModel.findById(userId);
            if (!user) {
                // Clean up any uploaded files
                if (files?.profilePicture?.[0]) {
                    await fileManager_1.FileManager.deleteFile(files.profilePicture[0].path);
                }
                if (files?.audioBio?.[0]) {
                    await fileManager_1.FileManager.deleteFile(files.audioBio[0].path);
                }
                res.status(404).json({
                    success: false,
                    message: "User not found",
                });
                return;
            }
            const socialLinks = DodoPageController.parseSocialLinks(req.body);
            const profilePictureUrl = files?.profilePicture?.[0]
                ? await (0, fileUpload_1.uploadToS3)(files.profilePicture[0], "dodo-profiles")
                : undefined;
            const audioBioUrl = files?.audioBio?.[0]
                ? await (0, fileUpload_1.uploadToS3)(files.audioBio[0], "dodo-audio")
                : undefined;
            const dodoPage = await models_1.DodoPageModel.create({
                userId,
                name,
                url: await DodoPageController.generateUniqueUrl(name),
                socialLinks,
                thoughts,
                profilePicture: profilePictureUrl,
                audioBio: audioBioUrl,
            });
            user.dodoPages.push(dodoPage._id);
            await user.save();
            // Convert Map back to object for response
            const socialLinksObject = Object.fromEntries(dodoPage.socialLinks);
            res.status(201).json({
                success: true,
                dodoPage: {
                    id: dodoPage._id,
                    name: dodoPage.name,
                    url: dodoPage.url,
                    profilePicture: fileManager_1.FileManager.getFileUrl(profilePictureUrl),
                    socialLinks: socialLinksObject,
                    thoughts: dodoPage.thoughts,
                    audioBio: fileManager_1.FileManager.getFileUrl(audioBioUrl),
                    blocks: dodoPage.blocks,
                },
            });
        }
        catch (error) {
            // Clean up any uploaded files on error
            if (files?.profilePicture?.[0]) {
                await fileManager_1.FileManager.deleteFile(files.profilePicture[0].path);
            }
            if (files?.audioBio?.[0]) {
                await fileManager_1.FileManager.deleteFile(files.audioBio[0].path);
            }
            logger_1.logger.error("Error in createDodoPage:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }
    static async generateUniqueUrl(name) {
        const baseUrl = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const url = `${baseUrl}-${randomSuffix}`;
        const existingPage = await models_1.DodoPageModel.findOne({ url });
        if (existingPage) {
            return this.generateUniqueUrl(name);
        }
        return url;
    }
    static parseSocialLinks(body) {
        // If socialLinks is passed directly in the body
        if (body.socialLinks && typeof body.socialLinks === "object") {
            return new Map(Object.entries(body.socialLinks));
        }
        // If socialLinks is passed as form fields (socialLinks[platform])
        const socialLinks = new Map();
        Object.entries(body)
            .filter(([key]) => key.startsWith("socialLinks["))
            .forEach(([key, value]) => {
            const platform = key.match(/socialLinks\[(.*?)\]/)?.[1];
            if (platform && value) {
                socialLinks.set(platform, value);
            }
        });
        return socialLinks;
    }
    /**
     * Get DodoPage by URL
     */
    static async getDodoPageByUrl(req, res) {
        const { url } = req.params;
        try {
            const dodoPage = await models_1.DodoPageModel.findOne({ url }).populate("blocks");
            if (!dodoPage) {
                res.status(404).json({
                    success: false,
                    message: "DodoPage not found",
                });
                return;
            }
            const blocks = await models_1.BlockModel.find({
                dodoPageId: dodoPage._id,
            }).sort({ blockPositionalIndex: 1 });
            const blocksWithData = await Promise.all(blocks.map(async (block) => {
                let specificBlockData;
                switch (block.blockType) {
                    case block_1.BlockType.LINK:
                        specificBlockData = await models_1.LinkBlockModel.findOne({
                            blockId: block._id,
                        }).populate("badge");
                        break;
                    case block_1.BlockType.POLL:
                        specificBlockData = await models_1.PollBlockModel.findOne({
                            blockId: block._id,
                        });
                        break;
                    case block_1.BlockType.PRODUCT:
                        specificBlockData = await models_1.ProductBlockModel.findOne({
                            blockId: block._id,
                        });
                        break;
                    case block_1.BlockType.SEPARATOR:
                        specificBlockData = await models_1.SeparatorBlockModel.findOne({
                            blockId: block._id,
                        });
                        break;
                    case block_1.BlockType.HEADING:
                        specificBlockData = await models_1.HeadingBlockModel.findOne({
                            blockId: block._id,
                        });
                        break;
                }
                return {
                    id: block._id,
                    blockType: block.blockType,
                    blockCardSize: block.blockCardSize,
                    blockPositionalIndex: block.blockPositionalIndex,
                    isActive: block.isActive,
                    blockData: specificBlockData,
                };
            }));
            res.status(200).json({
                success: true,
                dodoPage: {
                    id: dodoPage._id,
                    name: dodoPage.name,
                    url: dodoPage.url,
                    profilePicture: fileManager_1.FileManager.getFileUrl(dodoPage.profilePicture),
                    socialLinks: dodoPage.socialLinks,
                    thoughts: dodoPage.thoughts,
                    audioBio: fileManager_1.FileManager.getFileUrl(dodoPage.audioBio),
                    blocks: blocksWithData,
                },
            });
        }
        catch (error) {
            logger_1.logger.error("Error in getDodoPageByUrl:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }
    /**
     * Update DodoPage
     */
    static async updateDodoPage(req, res) {
        const { id, userId } = req.body;
        const user = await models_1.UserModel.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        if (!id) {
            res.status(400).json({
                success: false,
                message: "DodoPage ID is required",
            });
            return;
        }
        if (!user.dodoPages.includes(id)) {
            res.status(403).json({
                success: false,
                message: "Unauthorized: You don't have permission to update this DodoPage",
            });
            return;
        }
        const files = req.files;
        try {
            const dodoPage = await models_1.DodoPageModel.findById(id);
            if (!dodoPage) {
                res.status(404).json({
                    success: false,
                    message: "DodoPage not found",
                });
                return;
            }
            // Update fields if provided
            if ("name" in req.body) {
                dodoPage.name = req.body.name;
            }
            if ("thoughts" in req.body) {
                dodoPage.thoughts = req.body.thoughts;
            }
            if ("socialLinks" in req.body ||
                Object.keys(req.body).some((key) => key.startsWith("socialLinks["))) {
                const newSocialLinks = DodoPageController.parseSocialLinks(req.body);
                dodoPage.socialLinks.clear();
                newSocialLinks.forEach((value, key) => {
                    dodoPage.socialLinks.set(key, value);
                });
            }
            console.log("Files", files);
            // Handle file updates
            if (files?.profilePicture?.[0]) {
                console.log('PROFILE PICTURE', files.profilePicture[0]);
                // Delete old file from S3
                await (0, fileUpload_1.deleteS3File)(dodoPage.profilePicture);
                // Upload new file to S3
                dodoPage.profilePicture = await (0, fileUpload_1.uploadToS3)(files.profilePicture[0], "dodo-profiles");
            }
            if (files?.audioBio?.[0]) {
                await (0, fileUpload_1.deleteS3File)(dodoPage.audioBio);
                dodoPage.audioBio = await (0, fileUpload_1.uploadToS3)(files.audioBio[0], "dodo-audio");
            }
            await dodoPage.save();
            // Convert Map back to object for response
            const socialLinksObject = Object.fromEntries(dodoPage.socialLinks);
            res.status(200).json({
                success: true,
                dodoPage: {
                    id: dodoPage._id,
                    name: dodoPage.name,
                    url: dodoPage.url,
                    profilePicture: fileManager_1.FileManager.getFileUrl(dodoPage.profilePicture),
                    socialLinks: socialLinksObject,
                    thoughts: dodoPage.thoughts,
                    audioBio: fileManager_1.FileManager.getFileUrl(dodoPage.audioBio),
                    blocks: dodoPage.blocks,
                },
            });
        }
        catch (error) {
            logger_1.logger.error("Error in updateDodoPage:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }
    /**
     * Get all DodoPages for a user
     */
    static async getUserDodoPages(req, res) {
        const { userId } = req.params;
        try {
            const dodoPages = await models_1.DodoPageModel.find({ userId }).select("_id name url profilePicture");
            res.status(200).json({
                success: true,
                dodoPages: dodoPages.map((page) => ({
                    id: page._id,
                    name: page.name,
                    url: page.url,
                    profilePicture: page.profilePicture,
                })),
            });
        }
        catch (error) {
            logger_1.logger.error("Error in getUserDodoPages:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }
    static async deleteDodoPage(req, res) {
        const { pageId } = req.params;
        try {
            const dodoPage = await models_1.DodoPageModel.findById(pageId);
            if (!dodoPage) {
                res.status(404).json({
                    success: false,
                    message: "DodoPage not found",
                });
                return;
            }
            // Delete associated files
            await fileManager_1.FileManager.deleteFile(dodoPage.profilePicture);
            await fileManager_1.FileManager.deleteFile(dodoPage.audioBio);
            // Remove reference from user
            await models_1.UserModel.updateOne({ _id: dodoPage.userId }, { $pull: { dodoPages: pageId } });
            await dodoPage.deleteOne();
            res.status(200).json({
                success: true,
                message: "DodoPage deleted successfully",
            });
        }
        catch (error) {
            logger_1.logger.error("Error in deleteDodoPage:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }
    /**
     * Get DodoPage by ID
     */
    static async getDodoPageById(req, res) {
        const { pageId } = req.params;
        try {
            const dodoPage = await models_1.DodoPageModel.findById(pageId);
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
                    profilePicture: fileManager_1.FileManager.getFileUrl(dodoPage.profilePicture),
                    socialLinks: dodoPage.socialLinks,
                    thoughts: dodoPage.thoughts,
                    audioBio: fileManager_1.FileManager.getFileUrl(dodoPage.audioBio),
                    blocks: dodoPage.blocks,
                },
            });
        }
        catch (error) {
            logger_1.logger.error("Error in getDodoPageById:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }
    /**
     * Update blocks of a DodoPage
     */
    static async updateDodoPageBlocks(req, res) {
        const { pageId } = req.params;
        const { blocks } = req.body;
        try {
            const dodoPage = await models_1.DodoPageModel.findById(pageId);
            if (!dodoPage) {
                res.status(404).json({
                    success: false,
                    message: "DodoPage not found",
                });
                return;
            }
            // Replace the existing blocks with the new ones
            dodoPage.blocks = blocks;
            await dodoPage.save();
            res.status(200).json({
                success: true,
                message: "Blocks updated successfully",
                dodoPage: {
                    id: dodoPage._id,
                    blocks: dodoPage.blocks,
                },
            });
        }
        catch (error) {
            logger_1.logger.error("Error in updateDodoPageBlocks:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }
}
exports.DodoPageController = DodoPageController;
