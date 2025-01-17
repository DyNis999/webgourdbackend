const { User } = require('../models/user');
const sendToken = require('../utils/jwtToken');
const cloudinary = require('cloudinary');
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Function to update the user's online status
async function updateOnlineStatus(userId, status) {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.isOnline = status;
        await user.save();
        console.log(`User ${userId} is now ${status ? 'online' : 'offline'}`);
    } catch (error) {
        console.error('Error updating online status:', error);
    }
}

// Route for fetching all users
exports.getAllUsers = async (req, res) => {
    try {
        const userList = await User.find().select('-passwordHash'); // Exclude passwordHash from the response
        if (!userList) {
            return res.status(500).json({ success: false, message: 'Error fetching users' });
        }
        res.status(200).json(userList); // Send the user list as a response
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

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

        // Update user online status to true
        await updateOnlineStatus(user._id, true);

        console.log('Password matched, sending token');
        sendToken(user, 200, res);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteUser = async (req, res) => {
    const userId = req.params.userId;

    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID format' });
        }

        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error); // Log the full error for debugging
        res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const userId = req.params.userId; // Correct parameter name
        const { isAdmin } = req.body;

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update the role
        user.isAdmin = isAdmin;
        await user.save();

        res.status(200).json({ success: true, message: 'User role updated successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
