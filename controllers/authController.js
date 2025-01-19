const fs = require('fs');
const User = require('../models/User');
const axios = require('axios')
const logger = require("../config/logger");
require("dotenv").config();

const verifyOtplessToken = async (token) => {
    if (!token) {
        return { success: false, message: "Token is required" };
    }

    const requestBody = new URLSearchParams();
    requestBody.append("client_id", process.env.OTPLESS_CLIENT_ID);
    requestBody.append("client_secret", process.env.OTPLESS_CLIENT_SECRET);
    requestBody.append("token", token);

    try {
        const response = await axios.post(
            "https://auth.otpless.app/auth/userInfo",
            requestBody,
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json, text/plain, */*",
                    "Accept-Language": "en-US,en;q=0.9",
                    Cookie: "_ga=GA1.1.306636767.1723741134; _gcl_gs=2.1.k1$i1723829425",
                },
            }
        );

        const data = response?.data;

        // Check if authentication was successful
        if (data?.authentication_details?.phone?.auth_state === "verified") {
            return {
                success: true,
                message: "User authenticated successfully",
                data,
            };
        } else {
            logger.error(
                "Authentication failed. Check the token or client credentials."
            );
            return {
                success: false,
                message: "Authentication failed. User could not be verified.",
                data,
            };
        }
    } catch (error) {
        logger.error("Error calling the OTPLESS API:", error.message);
        return {
            success: false,
            message: "An error occurred while making the API call.",
            error: error.message,
        };
    }
};

const verifyUser = async (req, res) => {
    const { mobileNumber, thirdPartyData } = req.body;

    if (
        !mobileNumber ||
        !thirdPartyData ||
        !thirdPartyData.userId ||
        !thirdPartyData.idToken
    ) {
        return res.status(400).json({
            success: false,
            message: "Mobile number and third-party data are required",
        });
    }

    let user = await User.findOne({ otplessId: thirdPartyData.userId });
    let isNewUser = false;

    if (!user) {
        isNewUser = true;

        user = new User({
            mobileNumber,
            otplessId: thirdPartyData.userId,
            token: thirdPartyData.idToken,
            isLoggedIn: true,
        });
    } else {
        user.token = thirdPartyData.idToken;
        user.isLoggedIn = true;

        isNewUser = false;
    }

    await user.save();

    return res.status(200).json({
        success: true,
        token: thirdPartyData.idToken,
        userId: user._id,
        isNewUser,
    });
};

// Function to store or update user details
const storeUserDetails = async (req, res) => {
    const { mobileNumber, name, category, userId } = req.body;

    if (!mobileNumber || !name || !category || !userId) {
        return res.status(400).json({
            error: "Mobile number, category, name, and userId are required",
        });
    }

    try {
        let user = await User.findOne({ _id: userId }); // Find using userId

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.name = name;
        user.category = category;
        user.dodoPageName = name;

        if (req.files && req.files.profilePicture) {
            user.profilePicture = req.files.profilePicture[0].path;
        }
        if (req.files && req.files.audioBio) {
            user.audioBio = req.files.audioBio[0].path;
        }

        await user.save();

        res.status(200).json({
            message: "User details updated successfully",
            userId: user.userId,
        });
    } catch (err) {
        logger.error("Error updating user details", err);
        res.status(500).json({ error: "Server error" });
    }
};

// Function to get user details using userId
const getUserDetails = async (req, res) => {
    const { userId } = req.params;
    
    if (!userId) {
        return res.status(400).json({ error: "UserId is required" });
    }

    try {
        const user = await User.findOne({ _id: userId }); // Find using userId

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let profilePictureData = null;
        let audioBioData = null;

        if (user.profilePicture && fs.existsSync(user.profilePicture)) {
            profilePictureData = fs
                .readFileSync(user.profilePicture)
                .toString("base64");
        }

        if (user.audioBio && fs.existsSync(user.audioBio)) {
            audioBioData = fs.readFileSync(user.audioBio).toString("base64");
        }

        res.status(200).json({
            userId: user?.username,
            mobileNumber: user?.mobileNumber,
            name: user?.name,
            category: user?.category,
            profilePicture: profilePictureData,
            audioBio: audioBioData,
            socialLinks: user?.socialLinks || {},
            thoughts: user?.thoughts,
            dodoPageName: user?.dodoPageName,
            ...user,
        });
    } catch (error) {
        logger.error("Error fetching user:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const updateUserDetails = async (req, res) => {
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
        const user = await User.findById(userId);

        if (!user) {
            logger.warn("User not found", { userId });
            return res.status(404).json({
                success: false,
                message: "User not found",
                error: `No user found with ID: ${userId}`,
            });
        }

        const allowedFields = [
            "mobileNumber",
            "thoughts",
            "socialLinks",
            "dodoPageName",
        ];

        // Track which fields were updated
        const updatedFields = [];

        Object.keys(req.body).forEach((key) => {
            if (allowedFields.includes(key)) {
                if (key === "socialLinks") {
                    try {
                        if (typeof req.body[key] === "string") {
                            user.socialLinks = {
                                ...user.socialLinks,
                                ...JSON.parse(req.body[key]),
                            };
                        } else {
                            user.socialLinks = {
                                ...user.socialLinks,
                                ...req.body[key],
                            };
                        }
                        updatedFields.push("socialLinks");
                    } catch (err) {
                        logger.error("Error parsing socialLinks:", {
                            error: err.message,
                            userId,
                            socialLinks: req.body[key],
                        });
                        throw new Error("Invalid socialLinks format");
                    }
                } else {
                    user[key] = req.body[key];
                    updatedFields.push(key);
                }
            }
        });

        // Handle file uploads
        if (req.files) {
            if (req.files.profilePicture?.[0]?.path) {
                // Delete old profile picture if exists
                if (user.profilePicture && fs.existsSync(user.profilePicture)) {
                    try {
                        fs.unlinkSync(user.profilePicture);
                    } catch (err) {
                        logger.warn("Error deleting old profile picture", {
                            error: err.message,
                            path: user.profilePicture,
                        });
                    }
                }
                user.profilePicture = req.files.profilePicture[0].path;
                updatedFields.push("profilePicture");
            }

            if (req.files.audioBio?.[0]?.path) {
                // Delete old audio bio if exists
                if (user.audioBio && fs.existsSync(user.audioBio)) {
                    try {
                        fs.unlinkSync(user.audioBio);
                    } catch (err) {
                        logger.warn("Error deleting old audio bio", {
                            error: err.message,
                            path: user.audioBio,
                        });
                    }
                }
                user.audioBio = req.files.audioBio[0].path;
                updatedFields.push("audioBio");
            }
        }

        if (updatedFields.length === 0) {
            logger.warn("No valid fields to update", { userId });
            return res.status(400).json({
                success: false,
                message: "No valid fields to update",
                error: "Request body doesn't contain any allowed fields",
            });
        }

        await user.save();

        logger.info("User details updated successfully", {
            userId,
            updatedFields,
        });

        return res.status(200).json({
            success: true,
            message: "User details updated successfully",
            data: {
                userId: user._id,
                mobileNumber: user.mobileNumber,
                name: user.name,
                category: user.category,
                thoughts: user.thoughts,
                socialLinks: user.socialLinks,
                dodoPageName: user.dodoPageName,
                bio: user.bio,
                hasProfilePicture: !!user.profilePicture,
                hasAudioBio: !!user.audioBio,
                updatedFields,
            },
        });
    } catch (error) {
        logger.error("Error updating user details", {
            error: error.message,
            stack: error.stack,
            userId,
            body: req.body,
        });

        return res.status(500).json({
            success: false,
            message: "Failed to update user details",
            error: error.message,
        });
    }
};


module.exports = {
    verifyUser,
    verifyOtplessToken,
    storeUserDetails,
    getUserDetails,
    updateUserDetails
};
