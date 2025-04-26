const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

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

module.exports = router; 