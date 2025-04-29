const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { upload, handleImageUpload } = require('../middleware/uploadMiddleware');

// Signup route
router.post('/signup', authController.signup);

// Check user profile status
router.post('/check-profile', authController.checkUserProfile);

// Login route
router.post('/login', authController.login);

// Verify OTP route
router.post('/verify-otp', authController.verifyOTP);

// Set password route
router.post('/set-password', authController.setPassword);

// Google Login route
router.post('/google-login', authController.googleLogin);

// Update profile route with image upload


module.exports = router; 