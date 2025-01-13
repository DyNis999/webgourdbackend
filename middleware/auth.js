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
        const authHeader = req.headers.authorization;
        console.log('Authorization Header:', authHeader); // Debugging log
        token = authHeader.split(' ')[1];
        token = token.replace(/"/g, ''); 
    }

    if (!token) {
        return res.status(401).json({ message: 'Login first to access this resource' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded Token:', decoded); // Debugging log
        const user = await User.findById(decoded.id); // Fetch full user object from DB
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        req.user = user; // Attach full user object
        req.auth = { userId: decoded.id }; // Attach just the user ID separately (if needed)
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

exports.authorizeAdmin = () => {
    return (req, res, next) => {
        console.log('User in authorizeAdmin:', req.user); // Debugging log
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({ message: `Access denied. Admin privileges required.` });
        }
        next();
    };
};
