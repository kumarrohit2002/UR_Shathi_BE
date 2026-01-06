const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const TempUser = require('../models/TempUser.model'); // Temporary user model
const User = require('../models/User.model'); // Main user model
const { sendEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const authService=require('../services/authService');
const imageUpload = require('../utils/imageUpload'); // for uploading image



// Signup controller
exports.signup = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required!',
            });
        }

        const existingUser = await User.findOne({ email });
        const existingTempUser = await TempUser.findOne({ email });

        if (existingUser) {
            return res.status(202).json({
                success: false,
                message: 'You have already registered. Please log in.',
            });
        }

        const hashPassword = await bcrypt.hash(password, 10); // Ensure hashing completes before proceeding
        const otp = crypto.randomInt(1000, 9999).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000;

        let tempUser;
        if (existingTempUser) {
            tempUser = existingTempUser;
            tempUser.otpExpires = otpExpires;
            tempUser.otp = otp;
            await tempUser.save();
        } else {
            tempUser = await TempUser.create({
                name,
                email,
                password: hashPassword,
                role,
                otp,
                otpExpires,
            });
        }

        console.log('Preparing to send email...');
        const subject = 'Email Verification OTP';
        const text = `Your OTP for email verification is: ${otp}`;
        const html = `<p>OTP is valid for 10 minutes</p>
                      <p>Your OTP for email verification is:</p>
                      <h3>${otp}</h3>`;

        await sendEmail(tempUser.email, subject, text, html);

        res.status(200).json({
            success: true,
            message: 'User registered. Please verify your email using the OTP sent to you.',
            user: tempUser,
            otp: otp, // Temporarily sending OTP for debugging (Remove in production)
        });
    } catch (error) {
        console.error('Error in SignUp:', error.message);
        res.status(500).json({
            success: false,
            message: 'An error occurred during signup.',
        });
    }
};


// Resend OTP controller
exports.resendOTP = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required.again signUp',
            });
        }
        const tempUser = await TempUser.findOne({ email });
        if (!tempUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found or already verified.',
            });
        }
        // Generate a new OTP
        const newOtp = crypto.randomInt(1000, 9999).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

        tempUser.otp = newOtp;
        tempUser.otpExpires = otpExpires;
        await tempUser.save();
        const subject = 'Resend OTP for Email Verification';
        const text = `Your new OTP for email verification is: ${newOtp}`;
        const html = `<p>Your new OTP for email verification is:</p><h3>${newOtp}</h3>`;

        await sendEmail(tempUser.email, subject, text, html);

        res.status(200).json({
            success: true,
            message: 'New OTP sent to your email.',
        });
    } catch (error) {
        console.error('Error in resending OTP:', error.message);
        res.status(500).json({
            success: false,
            message: 'An error occurred while resending the OTP.',
        });
    }
};

// Verify OTP controller
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required!',
            });
        }

        const tempUser = await TempUser.findOne({ email });

        if (!tempUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found or already verified.',
            });
        }

        if (tempUser.otpExpires < Date.now()) {
            return res.status(410).json({
                success: false,
                message: 'OTP expired. Please request a new one.',
            });
        }

        if (tempUser.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP.',
            });
        }

        // Create the user in the main User collection
        const user = await User.create({
            name: tempUser.name,
            email: tempUser.email,
            password: tempUser.password,
            role: tempUser.role,
        });

        // Remove the temporary user data
        await TempUser.deleteOne({ email });

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now log in.',
            user,
        });
    } catch (error) {
        console.error('Error in OTP verification:', error.message);
        res.status(500).json({
            success: false,
            message: 'An error occurred during OTP verification.',
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const isMatch = bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password',
            });
        }

        // Create JWT payload
        const payload = {
            _id: user._id,
            email: user.email,
            role: user.role,
        };

        // Sign JWT token
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

        // Set token in a cookie (HttpOnly for security)
        res.cookie('token', token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'rohit', // Use HTTPS in production
            sameSite: 'None', // Required for cross-origin requests
            maxAge: 12 * 60 * 60 * 1000, //12hr
        });

        user.password=undefined;

        return res.status(200).json({
            success: true,
            user,
            message: 'User logged in successfully!',
        });
    } catch (error) {
        console.error('Error in login:', error.message);
        return res.status(500).json({
            success: false,
            message: `Error: ${error.message}`,
        });
    }
};


exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        // Validate email input
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        // Generate a 4-digit OTP and expiration time
        const otp = crypto.randomInt(1000, 9999).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
        // Update user with OTP and expiration time
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();
        // Email details
        const subject = 'Password Reset OTP';
        const text = `Your OTP for password reset is: ${otp}`;
        const html = `<p>Your OTP for password reset is:</p><h3>${otp}</h3>`;
        // Send OTP via email
        await sendEmail(user.email, subject, text, html);
        // Return success response
        return res.status(200).json({
            success: true,
            message: 'OTP sent to your email for password reset',
        });
    } catch (error) {
        console.error('Error in forgot password:', error.message);
        return res.status(500).json({
            success: false,
            message: `Error: ${error.message}`,
        });
    }
};

exports.verifyPasswordOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        // Validate required fields
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        // Check if OTP is correct and not expired
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP',
            });
        }
        // Clear OTP and expiration time
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();
        // Return success response
        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
        });
    } catch (error) {
        console.error('Error in OTP verification:', error.message);
        return res.status(500).json({
            success: false,
            message: `Error: ${error.message}`,
        });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        // Validate required fields
        if (!email || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Hash the new password
        const hashPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashPassword;
        await user.save();

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Password reset successfully',
        });
    } catch (error) {
        console.error('Error in resetting password:', error.message);
        return res.status(500).json({
            success: false,
            message: `Error: ${error.message}`,
        });
    }
};


exports.isUser=async (req, res) => {
    try {
        const user = req.user; // User data from middleware
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated',
            });
        }

        if(user.role !== 'USER') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only users can access this route.',
            });
        }   

        return res.status(200).json({
            success: true,
            message: 'User is authenticated',
            user: user,
        });
    } catch (error) {
        console.error('Error in isUser:', error.message);
        return res.status(500).json({
            success: false,
            message: `Error: ${error.message}`,
        });
    }
}


exports.logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: false, // must match how cookie was set
      secure: process.env.NODE_ENV === "rohit", // same condition as login
      sameSite: "None",
    });

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error while logging out",
    });
  }
};
