const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");

const { registerUser, loginUser, logoutUser, deleteUser, updateUserRole, getAllUsers,
    getUserProfile, updateProfile, archiveUser,getAllArchiveUsers,deleteArchiveUser,restoreUser} = require('../controllers/userController');
const { isAuthenticatedUser, authorizeAdmin } = require('../middleware/auth');

// Get all users
router.get('/', getAllUsers);
router.get('/archive', getAllArchiveUsers);
router.post('/register', upload.single("image"), registerUser);
router.post('/verifyOTP', async (req, res) => {
    try {
        const { otp, userId } = req.body;
        if (!otp || !userId) {
            return res.status(400).json({ message: "OTP and User ID are required" });
        }
        const UserOTPVerification = require('../models/UserOTPVerification');
        const verification = await UserOTPVerification.findOne({ user: userId });
        if (!verification) {
            throw new Error("Account doesn't exist or OTP is invalid");
        }

        // Check if OTP is expired
        if (verification.expiresAt < new Date()) {
            await UserOTPVerification.deleteMany({ user: userId });
            throw new Error("OTP has expired");
        }

        // Compare the OTP
        const isMatch = await require('bcryptjs').compare(otp, verification.otp);
        if (!isMatch) {
            throw new Error("OTP is invalid");
        }

        if (!verification.verified) {
            verification.verified = true;
            await verification.save();
        } else {
            throw new Error("OTP has already been verified");
        }

        // Success
        return res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
});

router.post("/resendOTP", async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        const UserOTPVerification = require('../models/UserOTPVerification');
        const verification = await UserOTPVerification.findOne({ user: userId });
        if (!verification) {
            return res.status(404).json({ message: "No OTP found for this user" });
        }
        // Logic to resend OTP goes here
        // For example, you can generate a new OTP and send it via email or SMS
        return res.status(200).json({ message: "OTP resent successfully" });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});


router.post('/archive', upload.single("image"), archiveUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', isAuthenticatedUser, getUserProfile)
router.post('/restore', isAuthenticatedUser,restoreUser);
router.put('/updateProfile', isAuthenticatedUser, upload.single("image"), updateProfile);
// Delete user route
router.delete('/:userId', isAuthenticatedUser, authorizeAdmin(), deleteUser);
router.delete('/archive/:userId', isAuthenticatedUser, authorizeAdmin(), deleteArchiveUser);

// Update user role route (only accessible by admins)
router.put('/:userId/role', isAuthenticatedUser, authorizeAdmin(), updateUserRole);


module.exports = router;
