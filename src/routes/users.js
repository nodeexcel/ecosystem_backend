const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { handleImageUpload, upload } = require('../middleware/uploadMiddleware');

const  authMiddleware = require('../middleware/authMiddleware');

// Get user profile
router.get('/profile',authMiddleware, userController.getProfile);

router.post('/invite-member',authMiddleware,userController.inviteMember);

router.post('/accept-invitation',authMiddleware,userController.acceptInvitation);
// Update user profile
router.put('/profile', 
    upload,
    authMiddleware,
    handleImageUpload,
    userController.updateProfile
  );

module.exports = router; 