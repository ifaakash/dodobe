const mongoose = require('mongoose');
const { Schema } = mongoose;

// Schema for the main Link document
const linkListSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    blockId: { type: Schema.Types.ObjectId, ref: 'Block' },
    links: [{ type: Schema.Types.ObjectId, ref: 'Link' }]
});

const LinkList = mongoose.model('LinkList', linkListSchema);

module.exports = LinkList;
