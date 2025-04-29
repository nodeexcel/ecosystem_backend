const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { handleImageUpload, upload } = require('../middleware/uploadMiddleware');

const  verifyToken = require('../middleware/authMiddleware');

// Get user profile
router.get('/profile',verifyToken, userController.getProfile);

// Update user profile
router.put('/profile', 
    upload,
    verifyToken,
    handleImageUpload,
    userController.updateProfile
  );

module.exports = router; 