const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const i18n = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const {english,french}=require("./lib/i18n");
const cron=require("node-cron");
const prisma = require('./lib/prisma');

// Middleware
app.use(cors("*"));

// Custom middleware to handle webhook requests
app.use((req, res, next) => {
  //  console.log(req.originalUrl);
  if (req.originalUrl === '/api/payments/webhook') {
   
    next(); // Skip body parsing for webhook
  } else {
    express.json()(req, res, next); // Parse JSON normally for other routes
  }
});

i18n.use(i18nextMiddleware.LanguageDetector);

const i18nConfig={
  fallbackLng:'en',
  interpolation:{
         escapeValue:false
  },
  resources:{
      en:english,
      fr:french
  }

}

i18n.init(i18nConfig);

app.use(i18nextMiddleware.handle(i18n));


// Import and use routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const paymentRoutes = require('./routes/payments');
const passwordRoutes = require('./routes/password');
const contactRoutes = require('./routes/contacts');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/contacts', contactRoutes);


cron.schedule('0 0 * * *', async () => {
  console.log('Running subscription renewal/expiry check at', new Date().toLocaleString());

  try {
    // 1. Handle credit revocation for monthly renewal
    const teamsToRevoke = await prisma.team.findMany({
      where: {
        nextMonthRenewDate: { lte: new Date() },
        numberOfRenewMonths: { gt: 0 }
      }
    });

    for (const team of teamsToRevoke) {
      await prisma.team.update({
        where: { id: team.id },
        data: {
          credits: 0, // Revoke credits
          numberOfRenewMonths: team.numberOfRenewMonths - 1,
          nextMonthRenewDate:
            team.numberOfRenewMonths > 1
              ? new Date(new Date().setMonth(new Date().getMonth() + 1))
              : null // no next renewal if months are done
        }
      });

      console.log(`Credits revoked for user ${team.user.email}`);
    }

    // 2. Expire subscriptions when subscriptionEndDate passed or missing
    const expiredUsers = await prisma.user.findMany({
      where: {
        OR: [
          { subscriptionEndDate: { lt: new Date() } },
          { subscriptionEndDate: null }
        ],
        subscriptionStatus: 'active'
      }
    });

    for (const user of expiredUsers) {
      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionStatus: 'expired' }
      });

      await prisma.team.updateMany({
        where: { userId: user.id },
        data: { credits: 0 }
      });

      console.log(`Subscription expired for user ${user.email}`);
    }

    console.log('Scheduler run complete ✅');
  } catch (error) {
    console.error('Error in subscription scheduler:', error);
  }
});




// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 9876;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 