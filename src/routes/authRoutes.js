const express = require('express');
const {
    signup,
    verifyOTP,
    resendOTP,
    login,
    forgotPassword,
    verifyPasswordOTP,
    resetPassword,
    isUser,
    logout
} = require('../controllers/authController');
const { middleware } = require('../middleware/middleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);  // New route for resending OTP
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/verify-password-otp', verifyPasswordOTP);
router.post('/reset-password', resetPassword);
router.get('/isuser',middleware,isUser );


module.exports = router;
