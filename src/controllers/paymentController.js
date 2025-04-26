const strip = require('stripe')
const stripeService = strip(process.env.STRIPE_SECRET_KEY);

  exports.checkoutSession= async (req, res) => {
    try {
      const { sessionId } = req.body;
      const paymentIntent = await stripeService.checkout.sessions.retrieve(sessionId);

      res.json({ paymentIntent });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }


  exports.createSubscriptionSession= async (req, res) => {
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




