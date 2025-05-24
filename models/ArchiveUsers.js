const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userarchiveSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    passwordHash: {
        type: String,
        required: true,
        select: false
    },
    image: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    street: {
        type: String,
        default: ''
    },
    apartment: {
        type: String,
        default: ''
    },
    zip: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        default: ''
    },
    isOnline: { type: Boolean, default: false },
});

userarchiveSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) {
        return next();
    }
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    next();
});

userarchiveSchema.pre(["updateOne", "findByIdAndUpdate", "findOneAndUpdate"], async function (next) {
    const data = this.getUpdate();
    if (data.passwordHash) {
        data.passwordHash = await bcrypt.hash(data.passwordHash, 10);
    }
    next();
});

userarchiveSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME
    });
};

userarchiveSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.passwordHash);
};


userarchiveSchema.methods.getResetPasswordToken = async function () {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    return resetToken;
};

userarchiveSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

userarchiveSchema.set('toJSON', {
    virtuals: true,
});

exports.UserArchive = mongoose.model('UserArchive', userarchiveSchema);