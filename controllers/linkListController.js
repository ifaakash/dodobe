const LinkList = require('../models/LinkList');
const Link = require('../models/Link');
const User = require('../models/User');
const fs = require('fs');
const logger = require("../config/logger");

const createLinks = async (req, res) => {
    const { userId, urls } = req.body;

    if (!userId || !urls || !Array.isArray(urls) || urls.length === 0) {
        logger.warn("Invalid request payload", { userId, urls });
        return res.status(400).json({
            error: "User ID and a non-empty array of URLs are required",
        });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            logger.warn("User not found", { userId });
            return res.status(404).json({ error: "User not found" });
        }

        logger.info("Creating links for user", {
            userId,
            urls: urls.map(({ url, description, type, badge }) => ({
                url,
                description,
                type,
                badge:
                    typeof badge === "string" ? badge : JSON.stringify(badge),
            })),
        });

        let linkList = await LinkList.findOne({ userId });

        logger.info("Found LinkList", {
            userId,
            linkList: linkList ? linkList._id : "none",
        });

        if (!linkList) {
            linkList = new LinkList({ userId });
            await linkList.save();
            logger.info("Created new LinkList", {
                userId,
                linkListId: linkList._id,
            });
        }

        const newlinks = await Promise.all(
            urls.map(async ({ url, description, type, audio, badge }) => {
                // @dev Don't parse badge if it's already an object,
                const link = new Link({
                    url,
                    description,
                    type,
                    audio,
                    badge, // Store badge directly, no parsing needed
                });
                await link.save();
                return link._id;
            })
        );

        logger.info("Created new links", { userId, linkIds: newlinks });

        linkList.links = linkList.links.concat(newlinks);
        await linkList.save();

        res.status(201).json({
            message: "Links created/updated successfully",
            data: linkList,
        });
    } catch (err) {
        logger.error("Error creating/updating links", {
            error: err.message,
            stack: err.stack,
            userId,
            urls,
        });
        res.status(500).json({ error: "Server error" });
    }
};

const reorderLinks = async (req, res) => {
    const { userId, urls } = req.body;

    if (!userId || !urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: 'User ID and a non-empty array for URLs are required' });
    }

    try {
        const result = await LinkList.findOneAndUpdate(
            { userId },
            { $set: { links: urls } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ error: 'Link list not found' });
        }

        res.status(200).json({ message: 'Links reordered successfully', data: result });
    } catch (err) {
        console.error('Error reordering links', err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getBlockLinkList = async (req, res) => {
    const { userId } = req.params;

    try {
        const linkList = await LinkList.findOne({ userId }).populate('links');
        res.json(linkList?.links || []);
    } catch (err) {
        console.error('Error retrieving linkList', err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getLink = async (req, res) => {
    const { linkId } = req.params;

    if (!linkId) {
        return res.status(400).json({ error: 'Link ID is required' });
    }

    try {
        const link = await Link.findById(linkId);

        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        let audioLinkData = null;

        if (link?.audio && fs.existsSync(link.audio)) {
            audioLinkData = fs.readFileSync(link.audio).toString('base64');
        }

        res.json({
            url: link.url,
            description: link.description,
            type: link.type,
            audio: audioLinkData,
            badge: link.badge
        });
    } catch (err) {
        console.error('Error retrieving link', err);
        res.status(500).json({ error: 'Server error' });
    }
};

const editLink = async (req, res) => {
    const { linkId, url, description, type, badge } = req.body;

    if (!linkId || !url) {
        return res.status(400).json({ error: 'Link ID and URL are required' });
    }

    try {
        const link = await Link.findById(linkId);

        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        link.url = url;
        link.description = description;
        link.badge = JSON.parse(badge)

        link.createdAt = Date.now();
        link.type = type;

        if (req?.files?.audio) {
            link.audio = req.files.audio[0].path;
        }

        await link.save();

        res.status(200).json({ message: 'Link updated successfully' });
    } catch (err) {
        console.error('Error updating link', err);
        res.status(500).json({ error: 'Server error' });
    }
};

const deleteLink = async (req, res) => {
    const { userId, linkId } = req.body;

    if (!userId || !linkId) {
        return res.status(400).json({ error: 'User ID and Link ID are required' });
    }

    try {
        const link = await Link.findById(linkId);

        if (!link) {
            return res.status(404).json({ error: 'Link not found' });
        }

        await link.remove();

        await LinkList.findOneAndUpdate(
            { userId },
            { $pull: { links: linkId } }
        );

        res.status(200).json({ message: 'Link deleted successfully' });
    } catch (err) {
        console.error('Error deleting link', err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    createLinks,
    reorderLinks,
    getBlockLinkList,
    getLink,
    editLink,
    deleteLink,
};

module.exports = {
    createLinks,
    reorderLinks,
    getBlockLinkList,
    editLink,
    deleteLink,
    getLink
};





// {
//     "userId": "USER_ID_HERE",
//     "blockId": "BLOCK_ID_HERE",
//     "urls": [
//         {"url": "https://example.com/1", "description": "Example LinkList 1"},
//         {"url": "https://example.com/2", "description": "Example LinkList 2"}
//     ]
// }'
