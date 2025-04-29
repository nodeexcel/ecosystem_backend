const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');
const jwtVerfiy=require("../middleware/authMiddleware");
// Request password reset
router.post('/request-reset', passwordController.requestPasswordReset);

// Reset password with token
router.post('/reset', passwordController.resetPassword);

// Send OTP
router.post('/send-otp', passwordController.sentOtp);

// Set new password
router.post('/set-new', jwtVerfiy,passwordController.setNewPassword);

module.exports = router; 