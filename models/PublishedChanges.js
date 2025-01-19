const mongoose = require("mongoose");

const PublishedChangesSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        bio: {
            type: String,
            default: "",
        },
        profilePicture: {
            type: String,
            default: "",
        },
        audioBio: {
            type: String,
            default: "",
        },
        socialLinks: {
            type: Map,
            of: String,
            default: {},
        },
        links: [
            {
                id: { type: String, required: true },
                url: { type: String },
                description: { type: String, required: true },
                type: { type: String },
                audio: { type: String },
                badge: { type: Object },
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("PublishedChanges", PublishedChangesSchema);
