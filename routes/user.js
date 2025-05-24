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
