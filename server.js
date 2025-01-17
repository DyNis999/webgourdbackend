const { server } = require('./app'); // Import the server from app.js
const connectDatabase = require('./config/database');
const cloudinary = require('cloudinary');

// Load environment variables
const dotenv = require('dotenv');
dotenv.config({ path: './config/config.env' });

// Connect to the database
connectDatabase();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Start the server (already handled in app.js)
const PORT = process.env.PORT || 4000;
console.log(`Server started on port: ${PORT} in ${process.env.NODE_ENV} mode`);
