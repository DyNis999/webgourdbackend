const { User } = require('../models/user');
const sendToken = require('../utils/jwtToken');
const cloudinary = require('cloudinary');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

exports.registerUser = async (req, res, next) => {
    try {
        let result;
        // Uploading the image to Cloudinary
        try {
            result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'gourdify',
                width: 150,
                crop: "scale"
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Cloudinary upload failed', error: err.message });
        }

        const { name, email, password, phone, street, apartment, zip, city, country } = req.body;

        // Creating the user
        const user = new User({
            name,
            email,
            passwordHash: password, // Store plain password, it will be hashed in the pre-save hook
            phone,
            street,
            apartment,
            zip,
            city,
            country,
            image: result.secure_url, // Image URL after Cloudinary upload
        });

        // Save the user
        await user.save();

        // Send JWT token
        sendToken(user, 200, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        console.log('Email or password not provided');
        return res.status(400).json({ error: 'Please enter email & password' });
    }

    try {
        console.log(`Login attempt with email: ${email}`);
        let user = await User.findOne({ email }).select('+passwordHash');
        
        if (!user) {
            console.log('User not found');
            return res.status(401).json({ message: 'Invalid Email or Password' });
        }

        console.log('User found:', user);

        const isPasswordMatched = await user.comparePassword(password);
        console.log(`Password match result: ${isPasswordMatched}`);

        if (!isPasswordMatched) {
            console.log('Password does not match');
            return res.status(401).json({ message: 'Invalid Email or Password' });
        }

        console.log('Password matched, sending token');
        sendToken(user, 200, res);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
