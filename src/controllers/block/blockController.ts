import { Request, Response } from "express";
import {
    BlockModel,
    DodoPageModel,
    LinkBlockModel,
    PollBlockModel,
    ProductBlockModel,
    HeadingBlockModel,
    BadgeModel,
} from "../../models";
import { logger } from "../../utils/logger";
import { FileManager } from "../../utils/fileManager";
import {
    CreateBlockRequest,
    UpdateBlockRequest,
    ReorderBlocksRequest,
    BlockType,
} from "../../types/block";
import mongoose, { Types } from "mongoose";

export class BlockController {
    /**
     * Create a new block
     */
    public static async createBlock(
        req: Request<{}, {}, CreateBlockRequest>,
        res: Response
    ): Promise<void> {
        const { dodoPageId, blockType, blockCardSize, blockData } = req.body;
        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };

        try {
            // Verify DodoPage exists
            const dodoPage = await DodoPageModel.findById(dodoPageId);
            if (!dodoPage) {
                res.status(404).json({
                    success: false,
                    message: "DodoPage not found",
                });
                return;
            }

            // Get the last block's index or start from 0
            const lastBlock = await BlockModel.findOne({ dodoPageId })
                .sort({ blockPositionalIndex: -1 })
                .limit(1);

            const newBlockIndex = lastBlock
                ? lastBlock.blockPositionalIndex + 1
                : 0;

            // Create main block with the new index
            const block = await BlockModel.create({
                dodoPageId,
                blockType,
                blockCardSize,
                blockPositionalIndex: newBlockIndex,
                isActive: true,
            });

            // Create specific block type data
            let specificBlockData;
            switch (blockType) {
                case BlockType.LINK:
                    if ("badge" in blockData) {
                        const badge = await BadgeModel.create(blockData.badge);
                        specificBlockData = await LinkBlockModel.create({
                            ...blockData,
                            blockId: block._id,
                            badge: badge._id,
                            linkDisplayPicture:
                                files?.linkDisplayPicture?.[0]?.path,
                        });
                    } else {
                        specificBlockData = await LinkBlockModel.create({
                            ...blockData,
                            blockId: block._id,
                            linkDisplayPicture:
                                files?.linkDisplayPicture?.[0]?.path,
                        });
                    }
                    break;

                case BlockType.POLL:
                    specificBlockData = await PollBlockModel.create({
                        ...blockData,
                        blockId: block._id,
                    });
                    break;

                case BlockType.PRODUCT:
                    specificBlockData = await ProductBlockModel.create({
                        ...blockData,
                        blockId: block._id,
                        productImage: files?.productImage?.[0]?.path,
                    });
                    break;

                case BlockType.HEADING:
                    specificBlockData = await HeadingBlockModel.create({
                        ...blockData,
                        blockId: block._id,
                    });
                    break;
            }

            // Update DodoPage blocks array
            dodoPage.blocks.push(block._id as Types.ObjectId);
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
        } catch (error) {
            // Clean up any uploaded files on error
            if (files) {
                Object.values(files).forEach((fileArray) => {
                    fileArray.forEach((file) => {
                        FileManager.deleteFile(file.path);
                    });
                });
            }

            logger.error("Error in createBlock:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    /**
     * Update block
     */
    public static async updateBlock(
        req: Request<{ blockId: string }, {}, UpdateBlockRequest>,
        res: Response
    ): Promise<void> {
        const { blockId } = req.params;
        const updates = req.body;
        const files = req.files as {
            [fieldname: string]: Express.Multer.File[];
        };

        try {
            const block = await BlockModel.findById(blockId);
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
                    case BlockType.LINK:
                        specificBlockData =
                            await LinkBlockModel.findOneAndUpdate(
                                { blockId },
                                {
                                    ...updates.blockData,
                                    linkDisplayPicture:
                                        files?.linkDisplayPicture?.[0]?.path,
                                },
                                { new: true }
                            );
                        break;

                    case BlockType.POLL:
                        specificBlockData =
                            await PollBlockModel.findOneAndUpdate(
                                { blockId },
                                updates.blockData,
                                { new: true }
                            );
                        break;

                    case BlockType.PRODUCT:
                        specificBlockData =
                            await ProductBlockModel.findOneAndUpdate(
                                { blockId },
                                {
                                    ...updates.blockData,
                                    productImage:
                                        files?.productImage?.[0]?.path,
                                },
                                { new: true }
                            );
                        break;

                    case BlockType.HEADING:
                        specificBlockData =
                            await HeadingBlockModel.findOneAndUpdate(
                                { blockId },
                                updates.blockData,
                                { new: true }
                            );
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
        } catch (error) {
            logger.error("Error in updateBlock:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    /**
     * Reorder blocks
     */
    public static async reorderBlocks(
        req: Request<{}, {}, ReorderBlocksRequest>,
        res: Response
    ): Promise<void> {
        const { blocks } = req.body;

        try {
            // Sort blocks by new index to ensure proper ordering
            const sortedBlocks = [...blocks].sort(
                (a, b) => a.newIndex - b.newIndex
            );

            // Use transactions only in production
            if (process.env.NODE_ENV === "production") {
                const session = await mongoose.startSession();
                session.startTransaction();

                try {
                    // Update each block's position
                    for (let i = 0; i < sortedBlocks.length; i++) {
                        const { blockId } = sortedBlocks[i];
                        await BlockModel.findByIdAndUpdate(
                            blockId,
                            { blockPositionalIndex: i },
                            { session }
                        );
                    }

                    await session.commitTransaction();
                } catch (error) {
                    await session.abortTransaction();
                    throw error;
                } finally {
                    session.endSession();
                }
            } else {
                // In non-production, use parallel updates
                const updatePromises = sortedBlocks.map((block, index) =>
                    BlockModel.findByIdAndUpdate(
                        block.blockId,
                        { blockPositionalIndex: index },
                        { new: true }
                    )
                );
                await Promise.all(updatePromises);
            }

            res.status(200).json({
                success: true,
                message: "Blocks reordered successfully",
            });
        } catch (error) {
            logger.error("Error in reorderBlocks:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    }

    /**
     * Delete block
     */
    public static async deleteBlock(
        req: Request<{ blockId: string }>,
        res: Response
    ): Promise<void> {
        const { blockId } = req.params;
        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                const block = await BlockModel.findById(blockId);
                if (!block) {
                    res.status(404).json({
                        success: false,
                        message: "Block not found",
                    });
                    return;
                }

                // Delete specific block type data and associated files
                switch (block.blockType) {
                    case BlockType.LINK:
                        const linkBlock = await LinkBlockModel.findOne({
                            blockId,
                        });
                        if (linkBlock) {
                            await FileManager.deleteFile(
                                linkBlock.linkDisplayPicture
                            );
                            if (linkBlock.badge) {
                                await BadgeModel.findByIdAndDelete(
                                    linkBlock.badge
                                );
                            }
                            await linkBlock.deleteOne();
                        }
                        break;

                    case BlockType.PRODUCT:
                        const productBlock = await ProductBlockModel.findOne({
                            blockId,
                        });
                        if (productBlock) {
                            await FileManager.deleteFile(
                                productBlock.productImage
                            );
                            await productBlock.deleteOne();
                        }
                        break;

                    default:
                        await BlockModel.deleteOne({ blockId });
                        break;
                }

                // Remove block reference from DodoPage
                await DodoPageModel.updateOne(
                    { _id: block.dodoPageId },
                    { $pull: { blocks: blockId } }
                );

                // Delete main block
                await block.deleteOne();

                // Reorder remaining blocks to fill the gap
                await BlockModel.updateMany(
                    {
                        dodoPageId: block.dodoPageId,
                        blockPositionalIndex: {
                            $gt: block.blockPositionalIndex,
                        },
                    },
                    { $inc: { blockPositionalIndex: -1 } },
                    { session }
                );
            });

            await session.commitTransaction();
            res.status(200).json({
                success: true,
                message: "Block deleted successfully",
            });
        } catch (error) {
            await session.abortTransaction();
            logger.error("Error in deleteBlock:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        } finally {
            session.endSession();
        }
    }
}
