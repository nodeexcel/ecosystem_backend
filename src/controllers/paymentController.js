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
      
      try {
        // Check if this is a subscription update payment
        if (session.metadata?.type === 'subscription_update') {
          // Update the subscription in Stripe
          const updatedSubscription = await stripe.subscriptions.update(session.metadata.subscriptionId, {
            items: [{
              id: session.metadata.subscriptionItemId,
              price: session.metadata.newPriceId,
            }],
          });

          // Get the new price details
          const newPrice = await stripe.prices.retrieve(session.metadata.newPriceId);
        

          // Get the product details to determine subscription type
          const product = await stripe.products.retrieve(newPrice.product);
          console.log('Product Details:', {
            id: product.id,
            name: product.name,
            metadata: product.metadata
          });

          // Determine subscription type based on product name or metadata
          let subscriptionType = 'pro';
          if (product.name.toLowerCase().includes('business')) {
            subscriptionType = 'business';
          } else if (product.name.toLowerCase().includes('team')) {
            subscriptionType = 'team';
          } else if (product.name.toLowerCase().includes('enterprise')) {
            subscriptionType = 'enterprise';
          }
          
          // Update user's subscription in database
          await prisma.user.update({
            where: { email: session.customer_details.email },
            data: { 
              subscriptionType: subscriptionType,
              subscriptionStatus: updatedSubscription.status,
              subscriptionId: updatedSubscription.id,
              paymentId: session.metadata.newPriceId
            }
          });

          console.log('Subscription updated successfully in database');
        } else {
          // Handle regular subscription creation
          const existingUser = await prisma.user.findUnique({
            where: { email: session.customer_email || session.customer_details?.email }
          });

          if (existingUser) {
            await prisma.user.update({
              where: { email: session.customer_email || session.customer_details?.email },
              data: { 
                stripeCustomerId: session.customer,
                subscriptionStatus: 'active',
                subscriptionId: session.subscription,
                paymentId: session.metadata?.newPriceId || null
              }
            });
          } else {
            await prisma.user.create({
              data: {
                email: session.customer_email || session.customer_details?.email,
                stripeCustomerId: session.customer,
                subscriptionStatus: 'active',
                subscriptionType: 'pro',  
                subscriptionId: session.subscription,
                paymentId: session.metadata?.newPriceId || null
              }
            });
          }
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

exports.createUpdateSubscriptionSession = async (req, res) => {
  try {
    const { email, priceId} = req.body;

    if (!email || !priceId) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and Price ID are required" 
      });
    }

    // Find user and their subscription
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        subscriptionId: true,
        stripeCustomerId: true
      }
    });

    if (!user || !user.subscriptionId) {
      return res.status(404).json({ 
        success: false, 
        message: "No active subscription found for this user" 
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      subscription_data: {
        metadata: {
          subscriptionId: user.subscriptionId
        }
      },
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:`${process.env.FRONTEND_URL}/cancel`,
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id
    });

  } catch (error) {
    console.error('Error creating update subscription session:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.updateSubscriptionWithProration = async (req, res) => {
  try {
    const { email, priceId } = req.body;

    if (!email || !priceId) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and Price ID are required" 
      });
    }

    // Find user and their subscription
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        subscriptionId: true,
        stripeCustomerId: true
      }
    });

    if (!user || !user.subscriptionId) {
      return res.status(404).json({ 
        success: false, 
        message: "No active subscription found for this user" 
      });
    }

    // Retrieve the subscription to get the item ID
    const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
    const subscriptionItemId = subscription.items.data[0]?.id;

    if (!subscriptionItemId) {
      return res.status(400).json({
        success: false,
        message: "Subscription item ID not found"
      });
    }

    // Get both current and new prices
    const currentPrice = await stripe.prices.retrieve(subscription.items.data[0].price.id);
    const newPrice = await stripe.prices.retrieve(priceId);

    // Calculate the difference between new and current prices
    const priceDifference = newPrice.unit_amount - currentPrice.unit_amount;
    const proratedAmount = Math.max(0, priceDifference); // Ensure we don't have negative amounts

    if(proratedAmount==0){
      res.status(400).json({
        success:false,
        message:"unable to process your requrest"
      })
    }

    // Create a checkout session for the prorated amount
    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Subscription Update Proration',
          },
          unit_amount: proratedAmount,
        },
        quantity: 1,
      }],
      metadata: {
        subscriptionId: user.subscriptionId,
        subscriptionItemId: subscriptionItemId,
        newPriceId: priceId,
        type: 'subscription_update'
      },
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      proratedAmount: proratedAmount,
      currency: 'eur',
      subscriptionId: user.subscriptionId,
      currentPrice: currentPrice.unit_amount,
      newPrice: newPrice.unit_amount
    });

  } catch (error) {
    console.error('Error creating subscription update session:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};





