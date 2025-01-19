// routes/authRoutes.js
const express = require('express');
const { verifyUser, storeUserDetails, getUserDetails, updateUserDetails, verifyOtplessToken } = require('../controllers/authController');
const authenticateToken = require('../middlewares/authenticateToken');
const upload = require('../middlewares/upload');

const router = express.Router();

// router.post('/send-otp', sendOtp);

router.post('/verify-user', verifyUser);

router.post('/verify-token', verifyOtplessToken);

router.post('/store-user-details', authenticateToken, upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'audioBio', maxCount: 1 }
]), storeUserDetails);

router.post('/update-user-details/:userId', authenticateToken, upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'audioBio', maxCount: 1 }
]), updateUserDetails);

router.get('/get-user-details/:userId', authenticateToken, getUserDetails);

module.exports = router;
