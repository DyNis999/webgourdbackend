const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");

const { registerUser, loginUser, } = require('../controllers/userController');
const { isAuthenticatedUser, authorizeAdmin } = require('../middleware/auth');

router.post('/register', upload.single("image"), registerUser);
router.post('/login', loginUser)


module.exports = router;