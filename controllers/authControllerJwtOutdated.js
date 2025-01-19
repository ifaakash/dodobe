const jwt = require('jsonwebtoken');
const fs = require('fs');
const User = require('../models/User');

// Set up Twilio client
// const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';

const sendOtp = async (req, res) => {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
        return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    let user = await User.findOne({ mobileNumber });
    if (!user) {
        user = new User({ mobileNumber });
    }

    const otp = generateOtp();
    user.otp = otp;
    const valid = new Date(Date.now() + 10 * 60000);
    user.otpExpiration = valid

    await user.save();

    // try {
    //     await twilioClient.messages.create({
    //         body: `Your login OTP is: ${otp}`,
    //         from: process.env.TWILIO_PHONE_NUMBER,
    //         to: mobileNumber,
    //     });
    //     res.status(200).json({ success: true, message: `OTP sent to mobile number: ${mobileNumber}` });
    // } catch (error) {
    //     console.error('Failed to send OTP', error);
    //     res.status(500).json({ success: false, message: 'Failed to send OTP' });
    // }

    return res.status(200).json({ success: true, otp: otp, mobileNumber: mobileNumber, validTill: valid });
};

const verifyOtp = async (req, res) => {
    const { mobileNumber, otp } = req.body;
    let isNewUser = false;
    if (!mobileNumber || !otp) {
        return res.status(400).json({ success: false, message: 'Mobile number and OTP are required' });
    }

    const user = await User.findOne({ mobileNumber });

    if (!user) {
        isNewUser = true;
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.otp === otp && user.otpExpiration > new Date()) {
        user.isLoggedIn = true;
        user.otp = null; // Clear the OTP
        user.otpExpiration = null; // Clear the OTP expiration
        await user.save();

        const token = jwt.sign({ mobileNumber: user.mobileNumber }, jwtSecret, { expiresIn: '60d' });

        return res.status(200).json({ success: true, token: token, isNewUser, userId: user._id });
    } else {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
};

const storeUserDetails = async (req, res) => {
    const { mobileNumber, name, category } = req.body;

    if (!mobileNumber || !name || !category) {
        return res.status(400).json({ error: 'Mobile number, category and name are required' });
    }

    try {
        let user = await User.findOne({ mobileNumber });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.name = name;
        user.category = category;

        if (req.files.profilePicture) {
            user.profilePicture = req.files.profilePicture[0].path;
        }
        if (req.files.audioBio) {
            user.audioBio = req.files.audioBio[0].path;
        }

        await user.save();

        res.status(200).json({ message: 'User details updated successfully', userId: user._id });
    } catch (err) {
        console.error('Error updating user details', err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getUserDetails = async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ error: 'UserId is required' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let profilePictureData = null;
        let audioBioData = null;

        if (user?.profilePicture && fs.existsSync(user.profilePicture)) {
            profilePictureData = fs.readFileSync(user.profilePicture).toString('base64');
        }

        if (user?.audioBio && fs.existsSync(user.audioBio)) {
            audioBioData = fs.readFileSync(user.audioBio).toString('base64');
        }

        res.status(200).json({
            userId: user._id,
            username: user.username,
            mobileNumber: user.mobileNumber,
            name: user.name,
            category: user.category,
            profilePicture: profilePictureData,
            audioBio: audioBioData
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateUserDetails = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        Object.assign(user, req.body);

        if (req.files.profilePicture) {
            user.profilePicture = req.files.profilePicture[0].path;
        }

        if (req.files.audioBio) {
            user.audioBio = req.files.audioBio[0].path;
        }

        await user.save();

        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    sendOtp,
    verifyOtp,
    storeUserDetails,
    getUserDetails,
    updateUserDetails
};
