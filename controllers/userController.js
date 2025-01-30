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

// Route for logging out a user
exports.logoutUser = async (req, res) => {
    const { userId } = req.body; // Assuming you send the userId with the logout request

    console.log('Logging out user with ID:', userId); // Log userId to check

    try {
        // Update online status to false when user logs out
        await updateOnlineStatus(userId, false);

        res.status(200).send({ message: 'User logged out and online status updated' });
    } catch (error) {
        console.error('Error updating online status:', error); // Log error if it occurs
        res.status(500).send('Error updating online status');
    }
};

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

        // console.log('Password matched, sending token');
        // sendToken(user, 200, res);
         // Generate token and send it
         const token = user.getJwtToken();
         console.log('Generated Token:', token);
 
         res.status(200).cookie('token', token, {
             httpOnly: true,
             secure: process.env.NODE_ENV === 'production',
             expires: new Date(
                 Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
             ),
         }).json({
             success: true,
             token,
             user,
         });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getUserProfile = async (req, res, next) => {
    const user = await User.findById(req.user.id);

    return res.status(200).json({
        success: true,
        user
    })
}


exports.updateProfile = async (req, res, next) => {
    console.log('updateProfile function called'); // Log when the function is called
    try {
        const newUserData = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            street: req.body.street,
            apartment: req.body.apartment,
            zip: req.body.zip,
            city: req.body.city,
            country: req.body.country
        };

        // Update image
        if (req.file && req.file.path) {
            let user = await User.findById(req.user.id);

            const imageUrl = user.image;
            if (imageUrl) {
                const image_id = imageUrl.split('/').pop().split('.')[0]; // Extract public_id from URL
                await cloudinary.v2.uploader.destroy(`gourdify/${image_id}`);
            }

            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'gourdify',
                width: 150,
                crop: "scale"
            });

            newUserData.image = result.secure_url;
        }

        // console.log('Updating user with new data:', newUserData);
        await User.findByIdAndUpdate(req.user.id, newUserData, {
            new: true,
            runValidators: true,
            useFindAndModify: false
        });

        res.status(200).json({
            success: true
        });
    } catch (error) {
        // console.error('Error updating profile:', error); // Log the error details
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
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