import { Request, Response } from "express";
import {
  BlockModel,
  DodoPageModel,
  LinkBlockModel,
  PollBlockModel,
  ProductBlockModel,
  HeadingBlockModel,
  BadgeModel,
  SeparatorBlockModel,
  UserModel,
} from "../../models";
import { logger } from "../../utils/logger";
import { FileManager } from "../../utils/fileManager";
import {
  CreateBlockRequest,
  UpdateBlockRequest,
  ReorderBlocksRequest,
  BlockType,
  ILinkBlock,
  IProductBlock,
} from "../../types/block";
import mongoose, { Types } from "mongoose";
import { uploadToS3 } from "../../middleware/fileUpload";

export class BlockController {
  /**
   * Create a new block
   */
  public static async createBlock(
    req: Request<{}, {}, CreateBlockRequest>,
    res: Response
  ): Promise<void> {
    const { dodoPageId, blockType, blockCardSize, blockData, userId } =
      req.body;

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    try {
      // Verify DodoPage exists and belongs to the user
      const dodoPage = await DodoPageModel.findOne({
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
      const lastBlock = await BlockModel.findOne({ dodoPageId })
        .sort({ blockPositionalIndex: -1 })
        .limit(1);

      const newBlockIndex = lastBlock ? lastBlock.blockPositionalIndex + 1 : 0;

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
              blockCardSize: block.blockCardSize,
              linkDisplayPicture: files?.linkDisplayPicture?.[0]?.path,
            });
          } else {
            specificBlockData = await LinkBlockModel.create({
              ...blockData,
              blockId: block._id,
              blockCardSize: block.blockCardSize,
              linkDisplayPicture: files?.linkDisplayPicture?.[0]?.path,
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

        case BlockType.SEPARATOR:
          specificBlockData = await SeparatorBlockModel.create({
            ...blockData,
            blockId: block._id,
          });
          break;
      }

      // Upload image to S3 if present and update the block data
      let imageUrl;
      if (files?.linkDisplayPicture && blockType === BlockType.LINK) {
        imageUrl = await uploadToS3(
          files.linkDisplayPicture[0],
          "block-images"
        );
        // Update LinkBlock with S3 URL
        await LinkBlockModel.findOneAndUpdate(
          { blockId: block._id },
          { linkDisplayPicture: imageUrl }
        );
        (specificBlockData as ILinkBlock).linkDisplayPicture = imageUrl;
      } else if (files?.productImage && blockType === BlockType.PRODUCT) {
        imageUrl = await uploadToS3(files.productImage[0], "block-images");
        // Update ProductBlock with S3 URL
        await ProductBlockModel.findOneAndUpdate(
          { blockId: block._id },
          { productImage: imageUrl }
        );
        (specificBlockData as IProductBlock).productImage = imageUrl;
      }

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
    req: Request<{}, {}, UpdateBlockRequest>,
    res: Response
  ): Promise<void> {
    const { blockId, userId } = req.body;
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

      const dodoPage = await DodoPageModel.findOne({
        _id: block.dodoPageId,
        userId: userId,
      });

      if (!dodoPage) {
        res.status(404).json({
          success: false,
          message: "DodoPage not found",
        });
        return;
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
            let imageUrl;
            if (files?.linkDisplayPicture) {
              imageUrl = await uploadToS3(files.linkDisplayPicture[0], "block-images");
            }
            if ("badge" in updates.blockData) {
              const badge = await BadgeModel.create(updates.blockData.badge);
              specificBlockData = await LinkBlockModel.findOneAndUpdate(
                { blockId },
                { 
                  ...updates.blockData, 
                  badge: badge._id,
                  ...(imageUrl && { linkDisplayPicture: imageUrl })
                },
                { new: true }
              );
            } else {
              specificBlockData = await LinkBlockModel.findOneAndUpdate(
                { blockId },
                { 
                  ...updates.blockData,
                  ...(imageUrl && { linkDisplayPicture: imageUrl })
                },
                { new: true }
              );
            }
            break;
          case BlockType.POLL:
            specificBlockData = await PollBlockModel.findOneAndUpdate(
              { blockId },
              updates.blockData,
              { new: true }
            );
            break;

          case BlockType.PRODUCT:
            let productImageUrl;
            if (files?.productImage) {
              productImageUrl = await uploadToS3(files.productImage[0], "block-images");
            }
            specificBlockData = await ProductBlockModel.findOneAndUpdate(
              { blockId },
              {
                ...updates.blockData,
                ...(productImageUrl && { productImage: productImageUrl })
              },
              { new: true }
            );
            break;

          case BlockType.SEPARATOR:
            specificBlockData = await SeparatorBlockModel.findOneAndUpdate(
              { blockId },
              updates.blockData,
              { new: true }
            );
            break;

          case BlockType.HEADING:
            specificBlockData = await HeadingBlockModel.findOneAndUpdate(
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
    const { blocks, dodoPageId } = req.body;

    try {
      // Verify all blocks belong to the specified DodoPage
      const existingBlocks = await BlockModel.find({
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
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          // Update each block's position
          for (let i = 0; i < sortedBlocks.length; i++) {
            const { blockId } = sortedBlocks[i];
            await BlockModel.findOneAndUpdate(
              { _id: blockId, dodoPageId },
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
          BlockModel.findOneAndUpdate(
            { _id: block.blockId, dodoPageId },
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
    req: Request<{}, {}, { blockId: string; userId: string }>,
    res: Response
  ): Promise<void> {
    const { blockId, userId } = req.body;
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

        // Verify block ownership through DodoPage
        const dodoPage = await DodoPageModel.findOne({
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
          case BlockType.LINK:
            const linkBlock = await LinkBlockModel.findOne({
              blockId,
            });
            if (linkBlock) {
              await FileManager.deleteFile(linkBlock.linkDisplayPicture);
              if (linkBlock.badge) {
                await BadgeModel.findByIdAndDelete(linkBlock.badge);
              }
              await linkBlock.deleteOne();
            }
            break;

          case BlockType.PRODUCT:
            const productBlock = await ProductBlockModel.findOne({
              blockId,
            });
            if (productBlock) {
              await FileManager.deleteFile(productBlock.productImage);
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

  /**
   * Archive block
   */
  public static async archiveBlock(
    req: Request<{}, {}, { blockId: string; userId: string }>,
    res: Response
  ): Promise<void> {
    const { blockId, userId } = req.body;

    try {
      const block = await BlockModel.findById(blockId);
      if (!block) {
        res.status(404).json({
          success: false,
          message: "Block not found",
        });
        return;
      }

      // Verify block ownership through DodoPage
      const dodoPage = await DodoPageModel.findOne({
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

      block.isActive = false;
      await block.save();

      res.status(200).json({
        success: true,
        message: "Block archived successfully",
      });
    } catch (error) {
      logger.error("Error in archiveBlock:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Unarchive block
   */
  public static async unarchiveBlock(
    req: Request<{}, {}, { blockId: string; userId: string }>,
    res: Response
  ): Promise<void> {
    const { blockId, userId } = req.body;

    try {
      const block = await BlockModel.findById(blockId);
      if (!block) {
        res.status(404).json({
          success: false,
          message: "Block not found",
        });
        return;
      }

      block.isActive = true;
      await block.save();

      res.status(200).json({
        success: true,
        message: "Block unarchived successfully",
      });
    } catch (error) {
      logger.error("Error in unarchiveBlock:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get all archived blocks for a user
   */
  public static async getArchivedBlocks(
    req: Request<{ dodoPageURL: string }>,
    res: Response
  ): Promise<void> {
    const { dodoPageURL } = req.params;

    try {
      const dodoPage = await DodoPageModel.findOne({
        url: dodoPageURL,
      });

      if (!dodoPage) {
        res.status(404).json({
          success: false,
          message: "DodoPage not found",
        });
        return;
      }

      const archivedBlocks = await BlockModel.find({
        dodoPageId: dodoPage._id,
        isActive: false,
      }).sort({ blockPositionalIndex: 1 });

      const archivedBlocksWithData = await Promise.all(
        archivedBlocks.map(async (block) => {
          let specificBlockData;
          switch (block.blockType) {
            case BlockType.LINK:
              specificBlockData = await LinkBlockModel.findOne({
                blockId: block._id,
              }).populate("badge");
              break;
            case BlockType.POLL:
              specificBlockData = await PollBlockModel.findOne({
                blockId: block._id,
              });
              break;
            case BlockType.PRODUCT:
              specificBlockData = await ProductBlockModel.findOne({
                blockId: block._id,
              });
              break;
            case BlockType.SEPARATOR:
              specificBlockData = await SeparatorBlockModel.findOne({
                blockId: block._id,
              });
              break;
            case BlockType.HEADING:
              specificBlockData = await HeadingBlockModel.findOne({
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
        })
      );

      res.status(200).json({
        success: true,
        archivedBlocks: archivedBlocksWithData,
        message: "Archived blocks retrieved successfully",
      });
    } catch (error) {
      logger.error("Error in getArchivedBlocks:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get all blocks for a DodoPage by URL - NO USE
   */

  public static async getBlocksByDodoPageUrl(
    req: Request<{ dodoPageUrl: string }>,
    res: Response
  ): Promise<void> {
    const { dodoPageUrl } = req.params;

    try {
      // Find DodoPage by URL
      const dodoPage = await DodoPageModel.findOne({
        url: dodoPageUrl,
      });

      if (!dodoPage) {
        res.status(404).json({
          success: false,
          message: "DodoPage not found",
        });
        return;
      }

      const blocks = await BlockModel.find({
        dodoPageId: dodoPage._id,
        isActive: true,
      }).sort({ blockPositionalIndex: 1 });

      const blocksWithData = await Promise.all(
        blocks.map(async (block) => {
          let specificBlockData;
          switch (block.blockType) {
            case BlockType.LINK:
              specificBlockData = await LinkBlockModel.findOne({
                blockId: block._id,
              }).populate("badge");
              break;
            case BlockType.POLL:
              specificBlockData = await PollBlockModel.findOne({
                blockId: block._id,
              });
              break;
            case BlockType.PRODUCT:
              specificBlockData = await ProductBlockModel.findOne({
                blockId: block._id,
              });
              break;
            case BlockType.SEPARATOR:
              specificBlockData = await SeparatorBlockModel.findOne({
                blockId: block._id,
              });
              break;
            case BlockType.HEADING:
              specificBlockData = await HeadingBlockModel.findOne({
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
        })
      );

      res.status(200).json({
        success: true,
        blocks: blocksWithData,
        dodoPageName: dodoPage.name,
        dodoPageUrl: dodoPage.url,
        socialLinks: dodoPage.socialLinks,
        message: "Blocks retrieved successfully",
      });
    } catch (error) {
      logger.error("Error in getBlocksByDodoPageUrl:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get a block by ID
   */
  public static async getBlockById(
    req: Request<{ blockId: string }>,
    res: Response
  ): Promise<void> {
    const { blockId } = req.params;

    try {
      const block = await BlockModel.findById(blockId);

      let blockData;

      if (block?.blockType === BlockType.LINK) {
        const linkBlock = await LinkBlockModel.findOne({ blockId }).populate(
          "badge"
        );
        blockData = linkBlock;
      }

      if (block?.blockType === BlockType.PRODUCT) {
        const productBlock = await ProductBlockModel.findOne({ blockId });
        blockData = productBlock;
      }

      if (block?.blockType === BlockType.POLL) {
        const pollBlock = await PollBlockModel.findOne({ blockId });
        blockData = pollBlock;
      }

      if (block?.blockType === BlockType.SEPARATOR) {
        const separatorBlock = await SeparatorBlockModel.findOne({ blockId });
        blockData = separatorBlock;
      }

      if (block?.blockType === BlockType.HEADING) {
        const headingBlock = await HeadingBlockModel.findOne({ blockId });
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
    } catch (error) {
      logger.error("Error in getBlockById:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Poll vote
   */
  public static async pollVote(
    req: Request<{}, {}, { blockId: string; options: string[] }>,
    res: Response
  ): Promise<void> {
    try {
      const { blockId, options } = req.body;

      if (!mongoose.Types.ObjectId.isValid(blockId)) {
        res.status(400).json({ error: "Invalid block ID format" });
        return;
      }

      if (!Array.isArray(options) || options.length === 0) {
        res.status(400).json({ error: "Options must be a non-empty array" });
        return;
      }

      // Use findOneAndUpdate to atomically update the option counts
      const updatedPollBlock = await PollBlockModel.findOneAndUpdate(
        { blockId },
        {
          $inc: Object.fromEntries(
            options.map((option) => [`optionCounts.${option}`, 1])
          ),
        },
        { new: true }
      );

      if (!updatedPollBlock) {
        res.status(404).json({ error: "Poll block not found" });
        return;
      }

      res.status(200).json({
        success: true,
        block: updatedPollBlock,
        message: "Poll vote recorded successfully",
      });
    } catch (error) {
      console.error("Error in pollVote:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
