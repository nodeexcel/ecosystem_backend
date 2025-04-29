const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
require('dotenv').config();

const stripeService = {

  checkSession: async (sessionId) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log(session);
      return {
        paymentIntent: session,
        customerEmail: session.customer_email || session.customer_details?.email
      };
    } catch (error) {
      console.log(error);
      throw new Error(`Error retrieving checkout session: ${error.message}`);
    }
  },

  // Create a subscription session
  createSubscriptionSession: async (priceId, successUrl, cancelUrl, customerEmail = null) => {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/success`,
      
      });
      return session;
    } catch (error) {
      throw new Error(`Error creating subscription session: ${error.message}`);
    }
  },

}

module.exports = stripeService; 