const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");

const { registerUser, loginUser, deleteUser, updateUserRole, getAllUsers } = require('../controllers/userController');
const { isAuthenticatedUser, authorizeAdmin } = require('../middleware/auth');

// Get all users
router.get('/', getAllUsers);
router.post('/register', upload.single("image"), registerUser);
router.post('/login', loginUser);

// Delete user route
router.delete('/:userId', isAuthenticatedUser, authorizeAdmin(), deleteUser);

// Update user role route (only accessible by admins)
router.put('/:userId/role', isAuthenticatedUser, authorizeAdmin(), updateUserRole);


module.exports = router;
