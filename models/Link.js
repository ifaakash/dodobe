const mongoose = require('mongoose');
const { Schema } = mongoose;

// Schema for  links
const linkSchema = new Schema({
    url: { type: String },
    description: { type: String, required: true },
    createdAt: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String
    },
    audio: { type: String },
    badge: { type: Object }
});

const Link = mongoose.model('Link', linkSchema);

module.exports = Link;
