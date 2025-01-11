// const User = require('../models/user')
const { User } = require('../models/user');
const jwt = require("jsonwebtoken")

// exports.isAuthenticatedUser = async (req, res, next) => {

//     let token = ''

//     if (req.cookies) {
//         token = req.cookies.token
//     }

//     if (req.headers.authorization) {
//         const token = req.headers['authorization']?.split(' ')[1];  
//         console.log('Authorization header:', req.headers['authorization']);

//     }
//     console.log(token)

//     // const jwtString = token.split(' ')[1]
//     //  console.log("token", jwtString)

//     if (!token) {
//         return res.status(401).json({ message: 'Login first to access this resource' })
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET)
//     req.user = await User.findById(decoded.id);

//     next()


exports.isAuthenticatedUser = async (req, res, next) => {
    let token = '';

    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization; // Get the Authorization header
        console.log('Authorization Header:', authHeader); // Log the header for debugging
        token = authHeader.split(' ')[1]; // Extract the token after "Bearer"
        token = token.replace(/"/g, ''); 
    }

    console.log('Extracted Token:', token);

    if (!token) {
        return res.status(401).json({ message: 'Login first to access this resource' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded Token:', decoded); // Log the decoded token for verification
        req.auth = { userId: decoded.id }; // Attach the user ID to the request object
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};


exports.authorizeAdmin = () => {
    return (req, res, next) => {
        console.log(req.user, req.body);
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: `Access denied. Admin privileges required.` });
        }
        next();
    };
};