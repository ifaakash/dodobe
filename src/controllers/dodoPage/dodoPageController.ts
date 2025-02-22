import { Request, Response } from "express";
import {
  BlockModel,
  DodoPageModel,
  HeadingBlockModel,
  LinkBlockModel,
  PollBlockModel,
  ProductBlockModel,
  SeparatorBlockModel,
  UserModel,
} from "../../models";
import { logger } from "../../utils/logger";
import { FileManager } from "../../utils/fileManager";
import {
  CreateDodoPageRequest,
  UpdateDodoPageRequest,
} from "../../types/dodoPage";
import { SocialPlatform } from "../../types/user";
import { ID } from "@/types/common";
import { BlockType } from "../../types/block";
import { deleteS3File, uploadToS3 } from "../../middleware/fileUpload";

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

      const socialLinks = DodoPageController.parseSocialLinks(req.body);

      const profilePictureUrl = files?.profilePicture?.[0]
        ? await uploadToS3(files.profilePicture[0], "dodo-profiles")
        : undefined;

      const audioBioUrl = files?.audioBio?.[0]
        ? await uploadToS3(files.audioBio[0], "dodo-audio")
        : undefined;

      const dodoPage = await DodoPageModel.create({
        userId,
        name,
        url: await DodoPageController.generateUniqueUrl(name),
        socialLinks,
        thoughts,
        profilePicture: profilePictureUrl,
        audioBio: audioBioUrl,
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
          profilePicture: FileManager.getFileUrl(profilePictureUrl),
          socialLinks: socialLinksObject,
          thoughts: dodoPage.thoughts,
          audioBio: FileManager.getFileUrl(audioBioUrl),
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
      const dodoPage = await DodoPageModel.findOne({ url }).populate("blocks");
      if (!dodoPage) {
        res.status(404).json({
          success: false,
          message: "DodoPage not found",
        });
        return;
      }

      const blocks = await BlockModel.find({
        dodoPageId: dodoPage._id,
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
        dodoPage: {
          id: dodoPage._id,
          name: dodoPage.name,
          url: dodoPage.url,
          profilePicture: FileManager.getFileUrl(dodoPage.profilePicture),
          socialLinks: dodoPage.socialLinks,
          thoughts: dodoPage.thoughts,
          audioBio: FileManager.getFileUrl(dodoPage.audioBio),
          blocks: blocksWithData,
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
    const { id, userId } = req.body;

    const user = await UserModel.findById(userId);
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
        message:
          "Unauthorized: You don't have permission to update this DodoPage",
      });
      return;
    }
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

      // Update fields if provided
      if ("name" in req.body) {
        dodoPage.name = req.body.name as string;
      }
      if ("thoughts" in req.body) {
        dodoPage.thoughts = req.body.thoughts;
      }
      if (
        "socialLinks" in req.body ||
        Object.keys(req.body).some((key) => key.startsWith("socialLinks["))
      ) {
        const newSocialLinks = DodoPageController.parseSocialLinks(req.body);
        dodoPage.socialLinks.clear();
        newSocialLinks.forEach((value, key) => {
          dodoPage.socialLinks.set(key, value);
        });
      }

      // Handle file updates
      if (files?.profilePicture?.[0]) {
        console.log('PROFILE PICTURE', files.profilePicture[0])
        // Delete old file from S3
        await deleteS3File(dodoPage.profilePicture);
        // Upload new file to S3
        dodoPage.profilePicture = await uploadToS3(
          files.profilePicture[0],
          "dodo-profiles"
        );
      }
      if (files?.audioBio?.[0]) {
        await deleteS3File(dodoPage.audioBio);
        dodoPage.audioBio = await uploadToS3(files.audioBio[0], "dodo-audio");
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
          profilePicture: FileManager.getFileUrl(dodoPage.profilePicture),
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
          profilePicture: FileManager.getFileUrl(dodoPage.profilePicture),
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
