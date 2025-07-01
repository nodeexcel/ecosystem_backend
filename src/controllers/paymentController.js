const stripeService = require('../services/stripeService');
const prisma = require("../lib/prisma");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuid } = require('uuid');

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
    const { priceId,customerEmail } = req.body;
    const session = await stripeService.createSubscriptionSession(
      priceId,
      successUrl=process.env.FRONTEND_URL+"/success",
      cancelUrl=process.env.FRONTEND_URL+"/cancel",
      customerEmail
    );
  
    res.json({ sessionId: session.id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
}

// Stripe webhook handler function
exports.stripeWebhook = async (req, res) => {
  // Retrieve Stripe signature from request headers
  const sig = req.headers['stripe-signature'];
  // Get your Stripe webhook secret from environment variables
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log("Webhook call....");
  let event;

  try {
    // Get the raw request body
    const rawBody = req.body;

    // Verify the webhook signature and construct the event object
    event = await stripe.webhooks.constructEvent(
      rawBody,
      sig,
      endpointSecret
    );
  } catch (err) {
    // If signature verification fails, log and return error
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types from Stripe
  switch (event.type) {
    case 'checkout.session.completed': // Payment completed event
      const session = event.data.object;

      try {
        // Extract customer email and name from session
        const customerEmail = session.customer_details?.email || session.customer_email;
        const customerName = (session.customer_details?.name || session.customer_name)?.split(" ");

        // Handle subscription update
        if (session.metadata?.type === 'subscription_update') {
          // Update the existing subscription with new price
          const updatedSubscription = await stripe.subscriptions.update(session.metadata.subscriptionId, {
            items: [{
              id: session.metadata.subscriptionItemId,
              price: session.metadata.newPriceId,
            }],
          });

          // Retrieve the new price and associated product
          const newPrice = await stripe.prices.retrieve(session.metadata.newPriceId);
          const product = await stripe.products.retrieve(newPrice.product);

          let credits = 0;
          let subscriptionType = 'pro';

          const userId=parseInt(session.metadata.userId);

          // Set subscription type and credits based on product name
          if (product.name.toLowerCase().includes('business')) {
            subscriptionType = 'business';
            credits = 300000;
          } else if (product.name.toLowerCase().includes('team')) {
            subscriptionType = 'team';
            credits = 100000;
          } else if (product.name.toLowerCase().includes('enterprise')) {
            subscriptionType = 'enterprise';
            credits = 10000;
          }

          // Update user subscription details in the database
          const user = await prisma.user.update({
            where: { id:userId },
            data: {
              subscriptionType: subscriptionType,
              subscriptionStatus: updatedSubscription.status,
              subscriptionId: updatedSubscription.id,
              paymentId: session.metadata.newPriceId,
              subscriptionUpdatedAt: new Date(),
            }
          });

          // Find and update the user's team credits
          const team = await prisma.team.findFirst({ where: { userId: user.id } });
          await prisma.team.update({
            where: { id: team.id },
            data: { credits }
          });

          // Record the transaction in transaction history
          const amountPaidUpdate = (session.amount_total ?? 0) / 100;
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
                email: customerEmail,
              }
            });
          }

          console.log('Subscription updated successfully in database');

        // Handle credit purchase
        } else if (session.metadata?.type === "credits") {
          try {
            const userId = parseInt(session.metadata.userId);
            const credits = parseInt(session.metadata.credits, 10);

            // Find user's team and increment credits
            const team = await prisma.team.findFirst({ where: { userId } });
            await prisma.team.update({
              where: { id: team.id },
              data: { credits: { increment: credits } }
            });

            // Prepare transaction details
            const amountPaid = (session.amount_total ?? 0) / 100;
            const currency = session.currency;
            const paymentMethod = session.payment_method_types?.[0] || null;
            const transactionDate = new Date((session.created || Date.now() / 1000) * 1000);
            let receiptUrl = null;

            // Record credit purchase in transaction history
            await prisma.transactionHistory.create({
              data: {
                userId: userId,
                paymentId: session.payment_intent || session.id,
                amountPaid: amountPaid,
                currency: currency,
                status: session.payment_status,
                paymentMethod: paymentMethod,
                subscriptionType: 'credits',
                receiptUrl: receiptUrl,
                transactionDate: transactionDate,
                email: customerEmail,
              }
            });

            console.log(`Added ${credits} credits to user ${userId}`);

          } catch (error) {
            // Handle errors during credit processing
            console.error('Error processing credit purchase:', error);
            return res.status(500).json({
              error: 'Error processing credit purchase',
              details: error.message
            });
          }

        // Handle new subscription (user signup)
        } else {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: customerEmail }
          });

          const subscriptionType = 'pro';
          const amountPaidNew = (session.amount_total ?? 0) / 100;
          const currencyNew = session.currency;
          const paymentMethodNew = session.payment_method_types?.[0] || null;
          const transactionDateNew = new Date((session.created || Date.now() / 1000) * 1000);
          let receiptUrlNew = null;

          // Try to get receipt URL from PaymentIntent
          if (session.payment_intent) {
            try {
              const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
              receiptUrlNew = paymentIntent.charges.data[0]?.receipt_url || null;
            } catch (err) {
              console.error('Error retrieving PaymentIntent for receipt:', err);
            }
          }

          if (existingUser) {
            // If user exists, update their subscription details
            await prisma.user.update({
              where: { email: customerEmail },
              data: {
                stripeCustomerId: session.customer,
                subscriptionStatus: 'active',
                subscriptionId: session.subscription,
                paymentId: session.metadata?.newPriceId || null,
                subscriptionUpdatedAt: new Date(),
              }
            });

            // Add transaction history for existing user
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
                email: customerEmail,
                language:"english"
              }
            });

          } else {
            // If user does not exist, create new user and related records
            const newUser = await prisma.user.create({
              data: {
                firstName: customerName[0],
                lastName: customerName[1] || null,
                email: customerEmail,
                stripeCustomerId: session.customer,
                subscriptionStatus: 'active',
                subscriptionType: subscriptionType,
                subscriptionId: session.subscription,
                paymentId: session.metadata?.newPriceId || null,
                subscriptionStartDate: new Date(),
                subscriptionEndDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                subscriptionUpdatedAt: new Date(),
                role: "Admin",
                activeProfile: false,
                isProfileComplete: false
              }
            });

            // Create a new team for the user
            const teamId = uuid();
            const credits = subscriptionType === 'pro' ? 10000 : subscriptionType === "team" ? 100000 : 300000;

            const newTeam = await prisma.team.create({
              data: {
                userId: newUser.id,
                numberOfTeamMembers: 1,
                id: teamId,
                credits
              }
            });

            // Add the user as a team member (admin)
            await prisma.teammembers.create({
              data: {
                isAdmin: true,
                userId: newUser.id,
                teamId: teamId,
                role: "Admin"
              }
            });

            // Record the transaction for the new user
            await prisma.transactionHistory.create({
              data: {
                userId: newUser.id,
                paymentId: session.subscription,
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
        // Handle errors during user or transaction processing
        console.error('Error processing user data or saving transaction history:', error);
        return res.status(500).json({ error: 'Error processing user data or transaction history' });
      }
      break;

    default:
      // Log unhandled event types
      console.log(`Unhandled event type ${event.type}`);
  }

  // Respond to Stripe to acknowledge receipt of the event
  res.json({ received: true });
};


exports.createUpdateSubscriptionSession = async (req, res) => {
  try {
    const { email, priceId} = req.body;

    if (!email || !priceId) {
      return res.status(400).json({ 
        success: false, 
        message: req.t("emailPriceId")
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
        message: req.t("noActiveSub")
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
      success_url: `${process.env.FRONTEND_URL}/success?session_id=${CHECKOUT_SESSION_ID}`,
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
        message: req.t("emailPriceId")
      });
    }

    // Find user and their subscription
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        subscriptionId: true,
        stripeCustomerId: true,
        id:true,
        email:true,
      }
    });

    if (!user || !user.subscriptionId) {
      return res.status(404).json({ 
        success: false, 
        message: req.t("noActiveSub")
      });
    }

    // Retrieve the subscription to get the item ID
    const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
    const subscriptionItemId = subscription.items.data[0]?.id;

    if (!subscriptionItemId) {
      return res.status(400).json({
        success: false,
        message:req.t("subId")
      });
    }

    // Get both current and new prices
    const currentPrice = await stripe.prices.retrieve(subscription.items.data[0].price.id);
    const newPrice = await stripe.prices.retrieve(priceId);

    // Calculate the difference between new and current prices
    const priceDifference = newPrice.unit_amount - currentPrice.unit_amount;
    const proratedAmount = Math.max(0, priceDifference); // Ensure we don't have negative amounts

    // if(proratedAmount==0){
    //  return  res.status(400).json({
    //     success:false,
    //     message:"unable to process your requrest"
    //   })
    // }

    // Create a checkout session for the prorated amount
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email:user.email,
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
        type: 'subscription_update',
        userId:user.id
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


exports.createCreditsession=async (req, res) => {

  try{
  const { userId, credits, priceId } = req.body; // priceId from Stripe Dashboard

  const user=await prisma.user.findUnique({where:{id:userId}});

  const session = await stripe.checkout.sessions.create({  
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: process.env.FRONTEND_URL+"/success",
    cancel_url: process.env.FRONTEND_URL+"/cancel",
    customer_email:user.email,
    metadata: {
      userId: String(userId),
      credits: String(credits),
      type:"credits"
    },
  });

  res.status(200).json({ sessionId: session.id });
}catch(error){
  console.log("Error"+error.message);

  res.status(500).json({
    success:false,
    message:req.t("somethingWentWrong")
  })
}
};

