"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockController = void 0;
const models_1 = require("../../models");
const logger_1 = require("../../utils/logger");
const fileManager_1 = require("../../utils/fileManager");
const block_1 = require("../../types/block");
const mongoose_1 = __importDefault(require("mongoose"));
const fileUpload_1 = require("../../middleware/fileUpload");
class BlockController {
    /**
     * Create a new block
     */
    static async createBlock(req, res) {
        const { dodoPageId, blockType, blockCardSize, blockData, userId } = req.body;
        const files = req.files;
        try {
            // Verify DodoPage exists and belongs to the user
            const dodoPage = await models_1.DodoPageModel.findOne({
                _id: dodoPageId,
                userId: userId,
            });
            if (!dodoPage) {
                res.status(404).json({
                    success: false,
                    message: "DodoPage not found or unauthorized access",
                });
                return;
            }
            // Get the last block's index or start from 0
            const lastBlock = await models_1.BlockModel.findOne({ dodoPageId })
                .sort({ blockPositionalIndex: -1 })
                .limit(1);
            const newBlockIndex = lastBlock ? lastBlock.blockPositionalIndex + 1 : 0;
            // Create main block with the new index
            const block = await models_1.BlockModel.create({
                dodoPageId,
                blockType,
                blockCardSize,
                blockPositionalIndex: newBlockIndex,
                isActive: true,
            });
            // Create specific block type data
            let specificBlockData;
            switch (blockType) {
                case block_1.BlockType.LINK:
                    if ("badge" in blockData) {
                        const badge = await models_1.BadgeModel.create(blockData.badge);
                        specificBlockData = await models_1.LinkBlockModel.create({
                            ...blockData,
                            blockId: block._id,
                            badge: badge._id,
                            blockCardSize: block.blockCardSize,
                            linkDisplayPicture: files?.linkDisplayPicture?.[0]?.path,
                        });
                    }
                    else {
                        specificBlockData = await models_1.LinkBlockModel.create({
                            ...blockData,
                            blockId: block._id,
                            blockCardSize: block.blockCardSize,
                            linkDisplayPicture: files?.linkDisplayPicture?.[0]?.path,
                        });
                    }
                    break;
                case block_1.BlockType.POLL:
                    specificBlockData = await models_1.PollBlockModel.create({
                        ...blockData,
                        blockId: block._id,
                    });
                    break;
                case block_1.BlockType.PRODUCT:
                    specificBlockData = await models_1.ProductBlockModel.create({
                        ...blockData,
                        blockId: block._id,
                        productImage: files?.productImage?.[0]?.path,
                    });
                    break;
                case block_1.BlockType.HEADING:
                    specificBlockData = await models_1.HeadingBlockModel.create({
                        ...blockData,
                        blockId: block._id,
                    });
                    break;
                case block_1.BlockType.SEPARATOR:
                    specificBlockData = await models_1.SeparatorBlockModel.create({
                        ...blockData,
                        blockId: block._id,
                    });
                    break;
            }
            // Upload image to S3 if present and update the block data
            let imageUrl;
            if (files?.linkDisplayPicture && blockType === block_1.BlockType.LINK) {
                imageUrl = await (0, fileUpload_1.uploadToS3)(files.linkDisplayPicture[0], "block-images");
                // Update LinkBlock with S3 URL
                await models_1.LinkBlockModel.findOneAndUpdate({ blockId: block._id }, { linkDisplayPicture: imageUrl });
                specificBlockData.linkDisplayPicture = imageUrl;
            }
            else if (files?.productImage && blockType === block_1.BlockType.PRODUCT) {
                imageUrl = await (0, fileUpload_1.uploadToS3)(files.productImage[0], "block-images");
                // Update ProductBlock with S3 URL
                await models_1.ProductBlockModel.findOneAndUpdate({ blockId: block._id }, { productImage: imageUrl });
                specificBlockData.productImage = imageUrl;
            }
            dodoPage.blocks.push(block._id);
            await dodoPage.save();
            res.status(201).json({
                success: true,
                block: {
                    id: block._id,
                    blockType: block.blockType,
                    blockCardSize: block.blockCardSize,
                    blockPositionalIndex: block.blockPositionalIndex,
                    isActive: block.isActive,
                    blockData: specificBlockData,
                },
                message: "Block created successfully",
            });
        }
        catch (error) {
            // Clean up any uploaded files on error
            if (files) {
                Object.values(files).forEach((fileArray) => {
                    fileArray.forEach((file) => {
                        fileManager_1.FileManager.deleteFile(file.path);
                    });
                });
            }
            logger_1.logger.error("Error in createBlock:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error,
            });
        }
    }
    /**
     * Update block
     */
    static async updateBlock(req, res) {
        const { blockId, userId } = req.body;
        const updates = req.body;
        const files = req.files;
        try {
            const dodoPage = await models_1.DodoPageModel.findOne({
                url: updates?.dodopageUrl,
                userId: userId,
            });
            if (!dodoPage) {
                res.status(404).json({
                    success: false,
                    message: "DodoPage not found or unauthorized access",
                });
                return;
            }
            const block = await models_1.BlockModel.findById(blockId);
            if (!block) {
                res.status(404).json({
                    success: false,
                    message: "Block not found",
                });
                return;
            }
            if (updates.blockCardSize !== undefined) {
                console.log("updates.blockCardSize", updates.blockCardSize);
                block.blockCardSize = updates.blockCardSize;
            }
            if (updates.isActive !== undefined) {
                console.log("updates.isActive", updates.isActive);
                block.isActive = updates.isActive;
            }
            await block.save();
            let specificBlockData;
            // Update specific block type data
            if (updates.blockData) {
                switch (block.blockType) {
                    case block_1.BlockType.LINK:
                        let imageUrl;
                        const LinkBlock = await models_1.LinkBlockModel.findOne({ blockId });
                        if (files?.linkDisplayPicture) {
                            // Delete old file from S3
                            await (0, fileUpload_1.deleteS3File)(LinkBlock?.linkDisplayPicture);
                            // Upload new file to S3
                            imageUrl = await (0, fileUpload_1.uploadToS3)(files.linkDisplayPicture[0], "block-images");
                        }
                        if ("badge" in updates.blockData) {
                            const badge = await models_1.BadgeModel.create(updates.blockData.badge);
                            specificBlockData =
                                await models_1.LinkBlockModel.findOneAndUpdate({ blockId }, {
                                    ...updates.blockData,
                                    badge: badge._id,
                                    ...(imageUrl && {
                                        linkDisplayPicture: imageUrl,
                                    }),
                                }, { new: true });
                        }
                        else {
                            specificBlockData =
                                await models_1.LinkBlockModel.findOneAndUpdate({ blockId }, {
                                    ...updates.blockData,
                                    ...(imageUrl && {
                                        linkDisplayPicture: imageUrl,
                                    }),
                                }, { new: true });
                        }
                        break;
                    case block_1.BlockType.POLL:
                        specificBlockData = await models_1.PollBlockModel.findOneAndUpdate({ blockId }, updates.blockData, { new: true });
                        break;
                    case block_1.BlockType.PRODUCT:
                        const ProductBlock = await models_1.ProductBlockModel.findOne({
                            blockId,
                        });
                        let productImageUrl;
                        if (files?.productImage) {
                            await (0, fileUpload_1.deleteS3File)(ProductBlock?.productImage);
                            productImageUrl = await (0, fileUpload_1.uploadToS3)(files.productImage[0], "block-images");
                        }
                        specificBlockData =
                            await models_1.ProductBlockModel.findOneAndUpdate({ blockId }, {
                                ...updates.blockData,
                                ...(productImageUrl && {
                                    productImage: productImageUrl,
                                }),
                            }, { new: true });
                        break;
                    case block_1.BlockType.SEPARATOR:
                        specificBlockData =
                            await models_1.SeparatorBlockModel.findOneAndUpdate({ blockId }, updates.blockData, { new: true });
                        break;
                    case block_1.BlockType.HEADING:
                        specificBlockData =
                            await models_1.HeadingBlockModel.findOneAndUpdate({ blockId }, updates.blockData, { new: true });
                        break;
                }
            }
            else {
                // If no blockData, fetch the existing specific block data
                switch (block.blockType) {
                    case block_1.BlockType.LINK:
                        specificBlockData = await models_1.LinkBlockModel.findOne({
                            blockId,
                        }).populate("badge");
                        break;
                    case block_1.BlockType.POLL:
                        specificBlockData = await models_1.PollBlockModel.findOne({
                            blockId,
                        });
                        break;
                    case block_1.BlockType.PRODUCT:
                        specificBlockData = await models_1.ProductBlockModel.findOne({
                            blockId,
                        });
                        break;
                    case block_1.BlockType.SEPARATOR:
                        specificBlockData = await models_1.SeparatorBlockModel.findOne({
                            blockId,
                        });
                        break;
                    case block_1.BlockType.HEADING:
                        specificBlockData = await models_1.HeadingBlockModel.findOne({
                            blockId,
                        });
                        break;
                }
                res.status(200).json({
                    success: true,
                    block: {
                        id: block._id,
                        blockType: block.blockType,
                        blockCardSize: block.blockCardSize,
                        blockPositionalIndex: block.blockPositionalIndex,
                        isActive: block.isActive,
                        // blockData: specificBlockData,
                    },
                    message: "Block updated successfully",
                });
            }
        }
        catch (error) {
            logger_1.logger.error("Error in updateBlock:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }
    /**
     * Reorder blocks
     */
    static async reorderBlocks(req, res) {
        const { blocks, dodoPageId } = req.body;
        try {
            // Verify all blocks belong to the specified DodoPage
            const existingBlocks = await models_1.BlockModel.find({
                _id: { $in: blocks.map((b) => b.blockId) },
                dodoPageId: dodoPageId,
            });
            if (existingBlocks.length !== blocks.length) {
                res.status(400).json({
                    success: false,
                    message: "Some blocks do not belong to the specified DodoPage",
                });
                return;
            }
            // Sort blocks by new index to ensure proper ordering
            const sortedBlocks = [...blocks].sort((a, b) => a.newIndex - b.newIndex);
            // Use transactions only in production
            if (process.env.NODE_ENV === "production") {
                const session = await mongoose_1.default.startSession();
                session.startTransaction();
                try {
                    // Update each block's position
                    for (let i = 0; i < sortedBlocks.length; i++) {
                        const { blockId } = sortedBlocks[i];
                        await models_1.BlockModel.findOneAndUpdate({ _id: blockId, dodoPageId }, { blockPositionalIndex: i }, { session });
                    }
                    await session.commitTransaction();
                }
                catch (error) {
                    await session.abortTransaction();
                    throw error;
                }
                finally {
                    session.endSession();
                }
            }
            else {
                // In non-production, use parallel updates
                const updatePromises = sortedBlocks.map((block, index) => models_1.BlockModel.findOneAndUpdate({ _id: block.blockId, dodoPageId }, { blockPositionalIndex: index }, { new: true }));
                await Promise.all(updatePromises);
            }
            res.status(200).json({
                success: true,
                message: "Blocks reordered successfully",
            });
        }
        catch (error) {
            logger_1.logger.error("Error in reorderBlocks:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }
    /**
     * Delete block
     */
    static async deleteBlock(req, res) {
        const { blockId, userId } = req.body;
        const session = await mongoose_1.default.startSession();
        try {
            await session.withTransaction(async () => {
                const block = await models_1.BlockModel.findById(blockId);
                if (!block) {
                    res.status(404).json({
                        success: false,
                        message: "Block not found",
                    });
                    return;
                }
                // Verify block ownership through DodoPage
                const dodoPage = await models_1.DodoPageModel.findOne({
                    _id: block.dodoPageId,
                    userId: userId,
                });
                if (!dodoPage) {
                    res.status(403).json({
                        success: false,
                        message: "Unauthorized access to block",
                    });
                    return;
                }
                // Delete specific block type data and associated files
                switch (block.blockType) {
                    case block_1.BlockType.LINK:
                        const linkBlock = await models_1.LinkBlockModel.findOne({
                            blockId,
                        });
                        if (linkBlock) {
                            await fileManager_1.FileManager.deleteFile(linkBlock.linkDisplayPicture);
                            if (linkBlock.badge) {
                                await models_1.BadgeModel.findByIdAndDelete(linkBlock.badge);
                            }
                            await linkBlock.deleteOne();
                        }
                        break;
                    case block_1.BlockType.PRODUCT:
                        const productBlock = await models_1.ProductBlockModel.findOne({
                            blockId,
                        });
                        if (productBlock) {
                            await fileManager_1.FileManager.deleteFile(productBlock.productImage);
                            await productBlock.deleteOne();
                        }
                        break;
                    default:
                        await models_1.BlockModel.deleteOne({ blockId });
                        break;
                }
                // Remove block reference from DodoPage
                await models_1.DodoPageModel.updateOne({ _id: block.dodoPageId }, { $pull: { blocks: blockId } });
                // Delete main block
                await block.deleteOne();
                // Reorder remaining blocks to fill the gap
                await models_1.BlockModel.updateMany({
                    dodoPageId: block.dodoPageId,
                    blockPositionalIndex: {
                        $gt: block.blockPositionalIndex,
                    },
                }, { $inc: { blockPositionalIndex: -1 } }, { session });
            });
            await session.commitTransaction();
            res.status(200).json({
                success: true,
                message: "Block deleted successfully",
            });
        }
        catch (error) {
            await session.abortTransaction();
            logger_1.logger.error("Error in deleteBlock:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
        finally {
            session.endSession();
        }
    }
    /**
     * Get all archived blocks for a user
     */
    static async getArchivedBlocks(req, res) {
        const { dodoPageURL } = req.params;
        try {
            const dodoPage = await models_1.DodoPageModel.findOne({
                url: dodoPageURL,
            });
            if (!dodoPage) {
                res.status(404).json({
                    success: false,
                    message: "DodoPage not found",
                });
                return;
            }
            const archivedBlocks = await models_1.BlockModel.find({
                dodoPageId: dodoPage._id,
                isActive: false,
            }).sort({ blockPositionalIndex: 1 });
            const archivedBlocksWithData = await Promise.all(archivedBlocks.map(async (block) => {
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
                archivedBlocks: archivedBlocksWithData,
                message: "Archived blocks retrieved successfully",
            });
        }
        catch (error) {
            logger_1.logger.error("Error in getArchivedBlocks:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }
    /**
     * Get all blocks for a DodoPage by URL
     */
    static async getBlocksByDodoPageUrl(req, res) {
        const { dodoPageUrl } = req.params;
        try {
            // Find DodoPage by URL
            const dodoPage = await models_1.DodoPageModel.findOne({
                url: dodoPageUrl,
            });
            if (!dodoPage) {
                res.status(404).json({
                    success: false,
                    message: "DodoPage not found",
                });
                return;
            }
            const blocks = await models_1.BlockModel.find({
                dodoPageId: dodoPage._id,
                isActive: true,
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
                blocks: blocksWithData,
                dodoPageName: dodoPage.name,
                dodoPageUrl: dodoPage.url,
                socialLinks: dodoPage.socialLinks,
                message: "Blocks retrieved successfully",
            });
        }
        catch (error) {
            logger_1.logger.error("Error in getBlocksByDodoPageUrl:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }
    /**
     * Get a block by ID
     */
    static async getBlockById(req, res) {
        const { blockId } = req.params;
        try {
            const block = await models_1.BlockModel.findById(blockId);
            let blockData;
            if (block?.blockType === block_1.BlockType.LINK) {
                const linkBlock = await models_1.LinkBlockModel.findOne({ blockId }).populate("badge");
                blockData = linkBlock;
            }
            if (block?.blockType === block_1.BlockType.PRODUCT) {
                const productBlock = await models_1.ProductBlockModel.findOne({ blockId });
                blockData = productBlock;
            }
            if (block?.blockType === block_1.BlockType.POLL) {
                const pollBlock = await models_1.PollBlockModel.findOne({ blockId });
                blockData = pollBlock;
            }
            if (block?.blockType === block_1.BlockType.SEPARATOR) {
                const separatorBlock = await models_1.SeparatorBlockModel.findOne({ blockId });
                blockData = separatorBlock;
            }
            if (block?.blockType === block_1.BlockType.HEADING) {
                const headingBlock = await models_1.HeadingBlockModel.findOne({ blockId });
                blockData = headingBlock;
            }
            if (!block) {
                res.status(404).json({
                    success: false,
                    message: "Block not found",
                });
            }
            const data = {
                blockId: block?._id,
                blockType: block?.blockType,
                blockCardSize: block?.blockCardSize,
                blockPositionalIndex: block?.blockPositionalIndex,
                isActive: block?.isActive,
                blockData: blockData,
            };
            res.status(200).json({
                success: true,
                data,
                message: "Block retrieved successfully",
            });
        }
        catch (error) {
            logger_1.logger.error("Error in getBlockById:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }
    /**
     * Poll vote
     */
    static async pollVote(req, res) {
        try {
            const { blockId, options } = req.body;
            if (!mongoose_1.default.Types.ObjectId.isValid(blockId)) {
                res.status(400).json({ error: "Invalid block ID format" });
                return;
            }
            if (!Array.isArray(options) || options.length === 0) {
                res.status(400).json({ error: "Options must be a non-empty array" });
                return;
            }
            // Use findOneAndUpdate to atomically update the option counts
            const updatedPollBlock = await models_1.PollBlockModel.findOneAndUpdate({ blockId }, {
                $inc: Object.fromEntries(options.map((option) => [`optionCounts.${option}`, 1])),
            }, { new: true });
            if (!updatedPollBlock) {
                res.status(404).json({ error: "Poll block not found" });
                return;
            }
            res.status(200).json({
                success: true,
                block: updatedPollBlock,
                message: "Poll vote recorded successfully",
            });
        }
        catch (error) {
            console.error("Error in pollVote:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
    // Add Auth for userID
    static async pollResponses(req, res) {
        const { blockId } = req.body;
        try {
            const pollBlock = await models_1.PollBlockModel.findOne({ blockId });
            if (!pollBlock) {
                res.status(404).json({
                    success: false,
                    message: "Poll block not found",
                });
                return;
            }
            res.status(200).json({
                success: true,
                message: "Poll responses retrieved successfully",
                pollBlock
            });
        }
        catch (error) {
            logger_1.logger.error("Error in pollResponses:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error: " + error,
            });
        }
    }
}
exports.BlockController = BlockController;
