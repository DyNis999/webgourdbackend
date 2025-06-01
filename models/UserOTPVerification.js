const mongoose = require('mongoose');
const userOTPVerificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });
const UserOTPVerification = mongoose.model('UserOTPVerification', 
    userOTPVerificationSchema);
module.exports = UserOTPVerification;