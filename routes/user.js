const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");

const { registerUser, loginUser, logoutUser, deleteUser, updateUserRole, getAllUsers,
    getUserProfile, updateProfile} = require('../controllers/userController');
const { isAuthenticatedUser, authorizeAdmin } = require('../middleware/auth');

// Get all users
router.get('/', getAllUsers);
router.post('/register', upload.single("image"), registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', isAuthenticatedUser, getUserProfile)
router.put('/updateProfile', isAuthenticatedUser, upload.single("image"), updateProfile);
// Delete user route
router.delete('/:userId', isAuthenticatedUser, authorizeAdmin(), deleteUser);

// Update user role route (only accessible by admins)
router.put('/:userId/role', isAuthenticatedUser, authorizeAdmin(), updateUserRole);


module.exports = router;
