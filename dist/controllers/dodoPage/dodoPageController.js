"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DodoPageController = void 0;
const models_1 = require("../../models");
const logger_1 = require("../../utils/logger");
const fileManager_1 = require("../../utils/fileManager");
class DodoPageController {
    /**
     * Create a new DodoPage
     */
    static async createDodoPage(req, res) {
        const { userId, name, socialLinks, thoughts } = req.body;
        const files = req.files;
        const uploadedFiles = [];
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
            const dodoPage = await models_1.DodoPageModel.create({
                userId,
                name,
                url: await this.generateUniqueUrl(name),
                socialLinks,
                thoughts,
                profilePicture: files?.profilePicture?.[0]?.path,
                audioBio: files?.audioBio?.[0]?.path,
            });
            user.dodoPages.push(dodoPage._id);
            await user.save();
            res.status(201).json({
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
                message: "DodoPage created successfully",
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
                message: "Internal server error",
            });
        }
    }
    static async generateUniqueUrl(baseName) {
        const maxAttempts = 5;
        let attempts = 0;
        while (attempts < maxAttempts) {
            const randomId = Math.random().toString(36).substring(2, 8);
            const url = `${baseName
                .toLowerCase()
                .replace(/\s+/g, "-")}-${randomId}`;
            const existingPage = await models_1.DodoPageModel.findOne({ url });
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
    static async getDodoPageByUrl(req, res) {
        const { url } = req.params;
        try {
            const dodoPage = await models_1.DodoPageModel.findOne({ url });
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
        }
        catch (error) {
            logger_1.logger.error("Error in getDodoPageByUrl:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
    /**
     * Update DodoPage
     */
    static async updateDodoPage(req, res) {
        const { id } = req.params;
        const updates = req.body;
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
        }
        catch (error) {
            logger_1.logger.error("Error in updateDodoPage:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
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
                message: "Internal server error",
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
                message: "Internal server error",
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
                message: "Internal server error",
            });
        }
    }
}
exports.DodoPageController = DodoPageController;
