const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes (require authentication)


router.post('/checkout-session', paymentController.checkoutSession);
router.post('/subscription-session', paymentController.createSubscriptionSession);
router.post('/update-subscription-session', paymentController.createUpdateSubscriptionSession);
router.post('/update-subscription',authMiddleware, paymentController.updateSubscriptionWithProration);

router.post('/webhook', 
  express.raw({type: 'application/json'}), 
  paymentController.stripeWebhook
);

module.exports = router; 