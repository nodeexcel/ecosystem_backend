const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { handleImageUpload, upload } = require('../middleware/uploadMiddleware');

const  authMiddleware = require('../middleware/authMiddleware');

// Get user profile
router.get('/profile',authMiddleware, userController.getProfile);

router.post('/invite-member',authMiddleware,userController.inviteMember);

router.post('/accept-invitation',userController.acceptInvitation);

// Get team members for admin
router.get('/team-members', authMiddleware, userController.getTeamMembers);

// Update user profile
router.put('/profile', 
    upload,
    authMiddleware,
    handleImageUpload,
    userController.updateProfile
  );

router.get('/transactions', authMiddleware, userController.getUserTransactions);

router.post('/change-language',authMiddleware,userController.changeLanguage);

router.patch('/delete-member',authMiddleware,userController.deleteMemberAccount);

module.exports = router; 