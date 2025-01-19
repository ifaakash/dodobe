const { verifyOtplessToken } = require("../controllers/authController");

// Middleware to protect routes
const authenticateToken = async (req, res, next) => {
    let idToken = req.headers['authorization'];

    idToken = idToken?.split(' ')[1] || '';

    if (!idToken) {
        return res.status(401).json({ success: false, message: 'Authorization token required' });
    }

    // Verify token with Otpless
    // const tokenVerificationResult = await verifyOtplessToken(idToken);

    // if (!tokenVerificationResult.success) {
    //     return res.status(401).json({ success: false, message: tokenVerificationResult.message });
    // }

    // // Attach user information to request object for further use
    // req.user = {
    //     userId: tokenVerificationResult.userId,
    //     mobileNumber: tokenVerificationResult.mobileNumber
    // };

    next(); // Proceed to the next middleware or route handler
};

module.exports = authenticateToken;