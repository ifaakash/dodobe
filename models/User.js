// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    mobileNumber: String,
    otp: String,
    otpExpiration: Date,
    name: String,
    dodoPageName: String,
    isLoggedIn: { type: Boolean, default: false },
    blocks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Block' }],
    profilePicture: { type: String },
    audioBio: { type: String },
    otplessId: { type: String, unique: true, sparse: true },
    socialLinks: { type: Object },
    thoughts: { type: String }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
