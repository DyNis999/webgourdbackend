const sendToken = (user, statusCode, res) => {
    // Debugging user object
    console.log('User Object:', user);

    // Generate Jwt token
    const token = user.getJwtToken();

    // Debugging generated token
    console.log('Generated Token:', token);

    // Options for cookie
    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
        ),
        httpOnly: true, // Secure setting
        secure: process.env.NODE_ENV === 'production', // Secure cookies in production
        sameSite: 'Strict', // CSRF protection
    };

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            image: user.image,
            isAdmin: user.isAdmin,
            phone: user.phone,
            country: user.country,
        },
    });
};

module.exports = sendToken;
