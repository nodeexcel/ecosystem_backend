const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();

// Middleware
app.use(cors());

// Custom middleware to handle webhook requests
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next(); // Skip body parsing for webhook
  } else {
    express.json()(req, res, next); // Parse JSON normally for other routes
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the KIN Backend API' });
});
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 