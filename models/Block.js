const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
    blockName: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Block = mongoose.model('Block', blockSchema);

module.exports = Block;
