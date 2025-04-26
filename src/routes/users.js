const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
// const { verifyToken } = require('../middleware/authMiddleware');

// Get user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.put('/profile', userController.updateProfile);

module.exports = router; 