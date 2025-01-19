const User = require('../models/User');
const Block = require('../models/Block');
const { Message } = require('twilio/lib/twiml/MessagingResponse');

// Create a block
const createBlock = async (req, res) => {
    const { userId, blockName } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID and block name are required' });
    }
    try {
        // Find the user in the database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create a new block
        const block = new Block({ blockName, userId });
        block.blockId = block._id;
        await block.save();

        // Add block reference to the user
        user.blocks.push(block._id);
        await user.save();

        res.status(200).json({ message: 'Block created successfully', blockId: block._id });
    } catch (err) {
        console.error('Error creating block', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get blocks for a user
const getUserBlocks = async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        // Find the user and populate the blocks
        const user = await User.findById(userId).populate('blocks');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user.blocks || []);
    } catch (err) {
        console.error('Error retrieving blocks', err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    createBlock,
    getUserBlocks,
};
