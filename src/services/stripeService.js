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

  createPhoneSessionCreditSession: async (userEmail, userId, amount, credits, currency = 'eur') => {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
          price_data: {
            currency,
            product_data: { name: `Phone session credits (${credits} )` },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        }],
        success_url: `${process.env.FRONTEND_URL}/dashboard/phone`,
        cancel_url: `${process.env.FRONTEND_URL}/cancel`,
        customer_email: userEmail,
        metadata: {
          userId: String(userId),
          credits: String(credits),
          amount: String(amount),
          type: 'phone_credits',
          purpose: 'phone_session_minutes'
        },
      });
      return session;
    } catch (error) {
      throw new Error(`Error creating phone session credit session: ${error.message}`);
    }
  },

}

module.exports = stripeService; 