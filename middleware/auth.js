const User = require('../models/user')
const jwt = require("jsonwebtoken")

exports.isAuthenticatedUser = async (req, res, next) => {

    let token = ''

    if (req.cookies) {
        token = req.cookies.token
    }

    if (req.headers.authorization) {
        token = req.headers.authorization.split('')[1];
    }
    console.log(token)

    // const jwtString = token.split(' ')[1]
    //  console.log("token", jwtString)

    if (!token) {
        return res.status(401).json({ message: 'Login first to access this resource' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id);

    next()

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