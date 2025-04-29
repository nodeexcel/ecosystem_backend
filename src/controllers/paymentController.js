const stripeService = require('../services/stripeService');
const prisma = require("../lib/prisma");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.checkoutSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const { paymentIntent, customerEmail } = await stripeService.checkSession(sessionId);

    res.json({ 
      paymentIntent,
      customerEmail 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

exports.createSubscriptionSession = async (req, res) => {
  try {
    const { priceId, successUrl, cancelUrl, customerEmail } = req.body;
    const session = await stripeService.createSubscriptionSession(
      priceId,
      successUrl,
      cancelUrl,
      customerEmail
    );
  
    res.json({ sessionId: session.id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log("Webhook call....");
  let event;

  try {
    // Get the raw body of the request
    const rawBody = req.body;
    
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      endpointSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
     
      console.log(session);
      
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: session.customer_email || session.customer_details?.email }
        });

        if (existingUser) {
          // Update existing user
          await prisma.user.update({
            where: { email: session.customer_email || session.customer_details?.email },
            data: { 
              stripeCustomerId: session.customer,
              subscriptionStatus: 'active',
              
              // Add any other fields to update
            }
          });
        } else {
          // Create new user
          await prisma.user.create({
            data: {
              email: session.customer_email || session.customer_details?.email,
              stripeCustomerId: session.customer,
              subscriptionStatus: 'active',
              subscriptionType:'pro'  
              // Add any other user fields you need
            }
          });
        }

        console.log('User data processed successfully');
      } catch (error) {
        console.error('Error processing user data:', error);
        return res.status(500).json({ error: 'Error processing user data' });
      }
      break;
    
    // Add other event types you want to handle
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
};




