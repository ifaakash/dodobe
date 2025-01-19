const PublishedChanges = require("../models/PublishedChanges");
const LinkList = require("../models/LinkList");
const User = require("../models/User");
const fs = require("fs");
const logger = require("../config/logger");

exports.publishChanges = async (req, res) => {
    logger.info("Publishing changes");
    const { userId } = req.body;

    if (!userId) {
        logger.warn("Missing userId in request", { userId });
        return res.status(400).json({
            success: false,
            message: "UserId is required",
            error: "Missing required field: userId",
        });
    }

    try {
        logger.info("Fetching link list data", { userId });
        const linkList = await LinkList.findOne({ userId }).populate("links");
        const links = linkList?.links || [];

        logger.info("Fetching user details", { userId });
        const user = await User.findOne({ _id: userId });

        if (!user) {
            logger.warn("User not found", { userId });
            return res.status(404).json({
                success: false,
                message: "User not found",
                error: `No user found with ID: ${userId}`,
            });
        }

        let profilePictureData = null;
        let audioBioData = null;

        // Read profile picture if exists
        if (user.profilePicture && fs.existsSync(user.profilePicture)) {
            logger.debug("Reading profile picture", {
                path: user.profilePicture,
            });
            profilePictureData = fs
                .readFileSync(user.profilePicture)
                .toString("base64");
        }

        // Read audio bio if exists
        if (user.audioBio && fs.existsSync(user.audioBio)) {
            logger.debug("Reading audio bio", { path: user.audioBio });
            audioBioData = fs.readFileSync(user.audioBio).toString("base64");
        }

        const publishData = {
            userId: userId,
            bio: user.bio || "",
            profilePicture: profilePictureData,
            audioBio: audioBioData,
            socialLinks: user.socialLinks || {},
            links: links.map((link) => ({
                id: link._id.toString(),
                url: link.url,
                description: link.description,
                type: link.type,
                audio: link.audio,
                badge: link.badge,
            })),
        };

        logger.info("Checking for existing published data", { publishData });
        const existingData = await PublishedChanges.findOne({ userId });

        if (existingData) {
            logger.info("Updating existing published data", { userId });
            Object.assign(existingData, publishData);
            await existingData.save();
            return res.status(200).json({
                success: true,
                message: "Changes published successfully!",
            });
        }

        logger.info("Creating new published data", { userId });
        const newPublishedChanges = new PublishedChanges(publishData);
        await newPublishedChanges.save();

        return res.status(201).json({
            success: true,
            message: "Changes published successfully!",
        });
    } catch (error) {
        logger.error("Error publishing changes", {
            error: error.message,
            stack: error.stack,
            userId,
        });
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

exports.getPublishedChanges = async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        logger.warn("Missing userId in request params");
        return res.status(400).json({
            success: false,
            message: "UserId is required",
            error: "Missing required parameter: userId",
        });
    }

    try {
        const publishedData = await PublishedChanges.findOne({ userId });

        if (!publishedData) {
            logger.warn("No published data found", { userId });
            return res.status(404).json({
                success: false,
                message: "No published data found for this user",
                error: `No published data found for user ID: ${userId}`,
            });
        }

        return res.status(200).json({ success: true, data: publishedData });
    } catch (error) {
        logger.error("Error fetching published changes", {
            error: error.message,
            stack: error.stack,
            userId,
        });
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
