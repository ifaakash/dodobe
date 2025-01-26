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
class BlockController {
    /**
     * Create a new block
     */
    static async createBlock(req, res) {
        const { dodoPageId, blockType, blockCardSize, blockData } = req.body;
        const files = req.files;
        try {
            // Verify DodoPage exists
            const dodoPage = await models_1.DodoPageModel.findById(dodoPageId);
            if (!dodoPage) {
                res.status(404).json({
                    success: false,
                    message: "DodoPage not found",
                });
                return;
            }
            // Get the last block's index or start from 0
            const lastBlock = await models_1.BlockModel.findOne({ dodoPageId })
                .sort({ blockPositionalIndex: -1 })
                .limit(1);
            const newBlockIndex = lastBlock
                ? lastBlock.blockPositionalIndex + 1
                : 0;
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
                            linkDisplayPicture: files?.linkDisplayPicture?.[0]?.path,
                        });
                    }
                    else {
                        specificBlockData = await models_1.LinkBlockModel.create({
                            ...blockData,
                            blockId: block._id,
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
            }
            // Update DodoPage blocks array
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
            });
        }
    }
    /**
     * Update block
     */
    static async updateBlock(req, res) {
        const { blockId } = req.params;
        const updates = req.body;
        const files = req.files;
        try {
            const block = await models_1.BlockModel.findById(blockId);
            if (!block) {
                res.status(404).json({
                    success: false,
                    message: "Block not found",
                });
                return;
            }
            // Update main block fields
            if (updates.blockPositionalIndex !== undefined) {
                block.blockPositionalIndex = updates.blockPositionalIndex;
            }
            if (updates.blockCardSize !== undefined) {
                block.blockCardSize = updates.blockCardSize;
            }
            if (updates.isActive !== undefined) {
                block.isActive = updates.isActive;
            }
            await block.save();
            // Update specific block type data
            if (updates.blockData) {
                let specificBlockData;
                switch (block.blockType) {
                    case block_1.BlockType.LINK:
                        specificBlockData =
                            await models_1.LinkBlockModel.findOneAndUpdate({ blockId }, {
                                ...updates.blockData,
                                linkDisplayPicture: files?.linkDisplayPicture?.[0]?.path,
                            }, { new: true });
                        break;
                    case block_1.BlockType.POLL:
                        specificBlockData =
                            await models_1.PollBlockModel.findOneAndUpdate({ blockId }, updates.blockData, { new: true });
                        break;
                    case block_1.BlockType.PRODUCT:
                        specificBlockData =
                            await models_1.ProductBlockModel.findOneAndUpdate({ blockId }, {
                                ...updates.blockData,
                                productImage: files?.productImage?.[0]?.path,
                            }, { new: true });
                        break;
                    case block_1.BlockType.HEADING:
                        specificBlockData =
                            await models_1.HeadingBlockModel.findOneAndUpdate({ blockId }, updates.blockData, { new: true });
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
                        blockData: specificBlockData,
                    },
                    message: "Block updated successfully",
                });
            }
        }
        catch (error) {
            logger_1.logger.error("Error in updateBlock:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }
    /**
     * Reorder blocks
     */
    static async reorderBlocks(req, res) {
        const { blocks } = req.body;
        try {
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
                        await models_1.BlockModel.findByIdAndUpdate(blockId, { blockPositionalIndex: i }, { session });
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
                const updatePromises = sortedBlocks.map((block, index) => models_1.BlockModel.findByIdAndUpdate(block.blockId, { blockPositionalIndex: index }, { new: true }));
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
                message: "Internal server error",
            });
        }
    }
    /**
     * Delete block
     */
    static async deleteBlock(req, res) {
        const { blockId } = req.params;
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
                message: "Internal server error",
            });
        }
        finally {
            session.endSession();
        }
    }
}
exports.BlockController = BlockController;
