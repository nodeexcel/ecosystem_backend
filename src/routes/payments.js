const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes (require authentication)


router.post('/checkout-session', paymentController.checkoutSession);
router.post('/subscription-session', paymentController.createSubscriptionSession);


module.exports = router; 