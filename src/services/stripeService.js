

const stripeService = {
  // Create a product
  createProduct: async (name, description, images = []) => {
    try {
      const product = await stripe.products.create({
        name,
        description,
        images,
      });
      return product;
    } catch (error) {
      throw new Error(`Error creating product: ${error.message}`);
    }
  },

  // Create a price for a product
  createPrice: async (productId, amount, currency = 'usd', interval = null) => {
    try {
      const priceData = {
        product: productId,
        unit_amount: amount,
        currency,
      };

      if (interval) {
        priceData.recurring = { interval };
      }

      const price = await stripe.prices.create(priceData);
      return price;
    } catch (error) {
      throw new Error(`Error creating price: ${error.message}`);
    }
  },

  // Create a checkout session
  createCheckoutSession: async (priceId, successUrl, cancelUrl, customerEmail = null) => {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
      });
      return session;
    } catch (error) {
      throw new Error(`Error creating checkout session: ${error.message}`);
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

  // Handle webhook events
  handleWebhook: async (payload, signature) => {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'checkout.session.completed':
          // Handle successful payment
          const session = event.data.object;
          // Add your logic here
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          // Handle subscription events
          const subscription = event.data.object;
          // Add your logic here
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      throw new Error(`Webhook Error: ${error.message}`);
    }
  },
};

module.exports = stripeService; 