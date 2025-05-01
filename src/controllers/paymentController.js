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
    const rawBody = req.body;

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      endpointSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;

      try {
        const customerEmail = session.customer_details?.email || session.customer_email;

        if (session.metadata?.type === 'subscription_update') {
          // Subscription update logic
          const updatedSubscription = await stripe.subscriptions.update(session.metadata.subscriptionId, {
            items: [{
              id: session.metadata.subscriptionItemId,
              price: session.metadata.newPriceId,
            }],
          });

          const newPrice = await stripe.prices.retrieve(session.metadata.newPriceId);
          const product = await stripe.products.retrieve(newPrice.product);

          let subscriptionType = 'pro';
          if (product.name.toLowerCase().includes('business')) {
            subscriptionType = 'business';
          } else if (product.name.toLowerCase().includes('team')) {
            subscriptionType = 'team';
          } else if (product.name.toLowerCase().includes('enterprise')) {
            subscriptionType = 'enterprise';
          }

          await prisma.user.update({
            where: { email: customerEmail },
            data: {
              subscriptionType: subscriptionType,
              subscriptionStatus: updatedSubscription.status,
              subscriptionId: updatedSubscription.id,
              paymentId: session.metadata.newPriceId
            }
          });

          // Save transaction history
          const amountPaidUpdate = (session.amount_total ?? 0)/100;
          const currencyUpdate = session.currency;
          const paymentMethodUpdate = session.payment_method_types?.[0] || null;
          const transactionDateUpdate = new Date((session.created || Date.now() / 1000) * 1000);

          const userUpdate = await prisma.user.findUnique({
            where: { email: customerEmail }
          });
          if (userUpdate) {
            await prisma.transactionHistory.create({
              data: {
                userId: userUpdate.id,
                paymentId: session.metadata.newPriceId,
                amountPaid: amountPaidUpdate,
                currency: currencyUpdate,
                status: session.payment_status,
                paymentMethod: paymentMethodUpdate,
                subscriptionType: subscriptionType,
                receiptUrl: null,
                transactionDate: transactionDateUpdate,
                email: customerEmail
              }
            });
          }

          console.log('Subscription updated successfully in database');

        } else {
          // New subscription logic
          const existingUser = await prisma.user.findUnique({
            where: { email: customerEmail }
          });

          const subscriptionType = 'pro';
          const amountPaidNew = (session.amount_total ?? 0)/100 ;
          const currencyNew = session.currency;
          const paymentMethodNew = session.payment_method_types?.[0] || null;
          const transactionDateNew = new Date((session.created || Date.now() / 1000) * 1000);
          let receiptUrlNew = null;

          if (session.payment_intent) {
            try {
              const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
              receiptUrlNew = paymentIntent.charges.data[0]?.receipt_url || null;
            } catch (err) {
              console.error('Error retrieving PaymentIntent for receipt:', err);
            }
          }

          if (existingUser) {
            await prisma.user.update({
              where: { email: customerEmail },
              data: {
                stripeCustomerId: session.customer,
                subscriptionStatus: 'active',
                subscriptionId: session.subscription,
                paymentId: session.metadata?.newPriceId || null
              }
            });

            await prisma.transactionHistory.create({
              data: {
                userId: existingUser.id,
                paymentId: session.payment_intent || session.subscription,
                amountPaid: amountPaidNew,
                currency: currencyNew,
                status: session.payment_status,
                paymentMethod: paymentMethodNew,
                subscriptionType: subscriptionType,
                receiptUrl: receiptUrlNew,
                transactionDate: transactionDateNew,
                email: customerEmail
              }
            });

          } else {
            const newUser = await prisma.user.create({
              data: {
                email: customerEmail,
                stripeCustomerId: session.customer,
                subscriptionStatus: 'active',
                subscriptionType: subscriptionType,
                subscriptionId: session.subscription,
                paymentId: session.metadata?.newPriceId || null
              }
            });

            await prisma.transactionHistory.create({
              data: {
                userId: newUser.id,
                paymentId: session.payment_intent || session.subscription,
                amountPaid: amountPaidNew,
                currency: currencyNew,
                status: session.payment_status,
                paymentMethod: paymentMethodNew,
                subscriptionType: subscriptionType,
                receiptUrl: receiptUrlNew,
                transactionDate: transactionDateNew,
                email: customerEmail
              }
            });
          }
        }

        console.log('User data and transaction history processed successfully');

      } catch (error) {
        console.error('Error processing user data or saving transaction history:', error);
        return res.status(500).json({ error: 'Error processing user data or transaction history' });
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

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





