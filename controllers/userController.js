const { User } = require('../models/user');
const sendToken = require('../utils/jwtToken');
const cloudinary = require('cloudinary');
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { UserArchive } = require('../models/ArchiveUsers');
const nodemailer = require('nodemailer');
const UserOTPVerification = require('../models/UserOTPVerification');
require('dotenv').config({ path: './config/config.env' });

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


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

// exports.registerUser = async (req, res, next) => {
//     try {
//         let result;
//         // Uploading the image to Cloudinary
//         try {
//             result = await cloudinary.v2.uploader.upload(req.file.path, {
//                 folder: 'gourdify',
//                 width: 150,
//                 crop: "scale"
//             });
//         } catch (err) {
//             return res.status(500).json({ success: false, message: 'Cloudinary upload failed', error: err.message });
//         }

//         const { name, email, password, phone, street, apartment, zip, city, country } = req.body;

//         // Creating the user
//         const user = new User({
//             name,
//             email,
//             passwordHash: password, // Store plain password, it will be hashed in the pre-save hook
//             phone,
//             street,
//             apartment,
//             zip,
//             city,
//             country,
//             image: result.secure_url, // Image URL after Cloudinary upload
//         });

//         // Save the user
//         await user.save();

//         // Send JWT token
//         sendToken(user, 200, res);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

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
            image: result.secure_url,
            verified: false // Image URL after Cloudinary upload
        });

        if (!user.name || !user.email || !user.passwordHash || !user.phone) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: user.email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        // Hash the password before saving
        // const saltRounds = 10;
        // user.passwordHash = await bcrypt.hash(user.passwordHash, saltRounds);


        // Save the user
        await user.save();

        console.log('User registered successfully:', user);
        try {
            await sendVerificationEmail(user); // Now properly handled
        } catch (emailError) {
            console.error(emailError);
            // Optionally: return res.status(500).json({ success: false, message: emailError.message });
        }

        sendToken(user, 200, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const sendVerificationEmail = async (user) => {
    try {
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`; // Generate a 4-digit OTP
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            // subject: 'Email Verification',
            // text: `Your verification code is: ${otp}`,
            subject: 'Email Verification',
            text: `Your verification code is: ${otp}`,
            html: `
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2 style="color: #4CAF50;">Gourdify Email Verification</h2>
    <p>Hello,</p>
    <p>Thank you for registering! Please use the following code to verify your email address:</p>
    <div style="font-size: 2em; font-weight: bold; color: #333; margin: 20px 0;">${otp}</div>
    <p>This code will expire in 10 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
    <br>
    <p>Best regards,<br>Gourdify Team</p>
  </div>
`,
        };

        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(otp, saltRounds);
        const newOTPVerification = new UserOTPVerification({
            user: user._id,
            otp: hashedOTP,
            expiresAt: Date.now() + 10 * 60 * 1000 // OTP valid for 10 minutes
        });

        await newOTPVerification.save();
        await transporter.sendMail(mailOptions);

        // Optionally return something if needed
        return {
            status: "PENDING",
            message: "Verification email sent successfully",
            data: {
                userId: user._id,
                email: user.email,
                otp: hashedOTP,
            }
        };
    } catch (error) {
        // Optionally throw error to be caught by the caller
        throw new Error("Failed to send verification email: " + error.message);
    }
};

// exports.loginUser = async (req, res, next) => {
//     const { email, password } = req.body;

//     if (!email || !password) {
//         console.log('Email or password not provided');
//         return res.status(400).json({ error: 'Please enter email & password' });
//     }

//     try {
//         console.log(`Login attempt with email: ${email}`);
//         let user = await User.findOne({ email }).select('+passwordHash');

//         if (!user) {
//             console.log('User not found');
//             return res.status(401).json({ message: 'Invalid Email or Password' });
//         }

//         console.log('User found:', user);

//         const isPasswordMatched = await user.comparePassword(password);
//         console.log(`Password match result: ${isPasswordMatched}`);

//         if (!isPasswordMatched) {
//             console.log('Password does not match');
//             return res.status(401).json({ message: 'Invalid Email or Password' });
//         }

//         // Update user online status to true
//         await updateOnlineStatus(user._id, true);

//         // console.log('Password matched, sending token');
//         // sendToken(user, 200, res);
//          // Generate token and send it
//          const token = user.getJwtToken();
//          console.log('Generated Token:', token);

//          res.status(200).cookie('token', token, {
//              httpOnly: true,
//              secure: process.env.NODE_ENV === 'production',
//              expires: new Date(
//                  Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
//              ),
//          }).json({
//              success: true,
//              token,
//              user,
//          });
//     } catch (error) {
//         console.error('Login error:', error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };


exports.loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        console.log('Email or password not provided');
        return res.status(400).json({ error: 'Please enter email & password' });
    }

    try {
        console.log(`Login attempt with email: ${email}`);

        // Check if user is in the archive
        const archivedUser = await UserArchive.findOne({ email });
        if (archivedUser) {
            console.log('User is archived, login denied');
            return res.status(403).json({ message: 'Your account has been archived. Please contact admin.' });
        }

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
        await updateOnlineStatus(user.id, true);

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

exports.archiveUser = async (req, res, next) => {
    try {
        let imageUrl = req.body.image;

        if (req.file && req.file.path) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'gourdify',
                    width: 150,
                    crop: "scale"
                });
                imageUrl = result.secure_url;
            } catch (err) {
                return res.status(500).json({ success: false, message: 'Cloudinary upload failed', error: err.message });
            }
        }

        // Remove _id to avoid duplicate key error
        const { _id, ...rest } = req.body;

        // Fetch the user from the database to get passwordHash
        const userFromDb = await User.findById(_id).select('+passwordHash');
        console.log('Fetched userFromDb:', userFromDb);

        if (!userFromDb) {
            return res.status(404).json({ success: false, message: 'User not found in main collection' });
        }

        const userarchive = new UserArchive({
            ...rest,
            passwordHash: userFromDb.passwordHash,
            image: imageUrl,
        });

        await userarchive.save();

        res.status(201).json({ success: true, message: "User archived successfully", userarchive });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.deleteArchiveUser = async (req, res) => {
    const userId = req.params.userId;

    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID format' });
        }

        const userarchive = await UserArchive.findByIdAndDelete(userId);
        if (!userarchive) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error); // Log the full error for debugging
        res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
    }
};
// Route for fetching all Archive USers
exports.getAllArchiveUsers = async (req, res) => {
    try {
        const userList = await UserArchive.find().select('-passwordHash'); // Exclude passwordHash from the response
        if (!userList) {
            return res.status(500).json({ success: false, message: 'Error fetching users' });
        }
        res.status(200).json(userList); // Send the user list as a response
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
exports.restoreUser = async (req, res) => {
    try {
        let imageUrl = req.body.image;

        if (req.file && req.file.path) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'gourdify',
                    width: 150,
                    crop: "scale"
                });
                imageUrl = result.secure_url;
            } catch (err) {
                return res.status(500).json({ success: false, message: 'Cloudinary upload failed', error: err.message });
            }
        }

        // Remove _id to avoid duplicate key error
        const { _id, ...rest } = req.body;

        // Fetch the user from the database to get passwordHash
        const userFromDb = await UserArchive.findById(_id).select('+passwordHash');
        console.log('Fetched userFromDb:', userFromDb);

        if (!userFromDb) {
            return res.status(404).json({ success: false, message: 'User not found in main collection' });
        }

        const userarchive = new User({
            ...rest,
            passwordHash: userFromDb.passwordHash,
            image: imageUrl,
        });

        await userarchive.save();

        res.status(201).json({ success: true, message: "User archived successfully", userarchive });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};