const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const stripeService = {

  checkSession: async (sessionId) => {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
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
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
      });
      return session;
    } catch (error) {
      throw new Error(`Error creating subscription session: ${error.message}`);
    }
  },

}

module.exports = stripeService; 