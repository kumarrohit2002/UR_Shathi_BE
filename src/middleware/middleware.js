// const jwt = require('jsonwebtoken');
// const User = require('../models/User.model');

// exports.middleware = async (req, res, next) => {
//     // let token=req.cookies.token || req.headers.authorization.split(' ')[1];
//     let token=req.cookies.token;


//     // Retrieve the token from the cookie
//     if (token) {
//         // token = req.cookies.token;

//         try {
//             // Verify the token
//             const decoded = jwt.verify(token, process.env.JWT_SECRET);
//             // Attach the user object to the request, excluding the password field
//             req.user = await User.findById(decoded.id).select('-password');
//             // Proceed to the next middleware
//             next();
//         } catch (error) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Not authorized, token failed',
//             });
//         }
//     } else {
//         return res.status(500).json({
//             success: false,
//             message: 'token is required',
//         });
//     }
// };




const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

exports.middleware = async (req, res, next) => {
    let token = req.cookies.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token',
        });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the user object to the request, excluding the password field
        req.user = await User.findById(decoded.id).select('-password');

        // Proceed to the next middleware
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, token failed',
        });
    }
};
