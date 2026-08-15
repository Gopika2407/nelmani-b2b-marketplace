const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Express middlewares
app.use(express.json());
app.use(cookieParser());

// Enable CORS for frontend requests
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
}));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);

// Test/Index route
app.get('/', (req, res) => {
  res.json({ message: 'NELMANI Agri-Marketplace API is live.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Background worker for Email retries (runs every 60 seconds)
const cronEmailRetry = async () => {
  const NotificationLog = require('./models/NotificationLog');
  const sendEmail = require('./utils/sendEmail');
  try {
    const failedEmails = await NotificationLog.find({ status: 'failed', retryCount: { $lt: 3 } });
    if (failedEmails.length > 0) {
      console.log(`[EMAIL RETRY WORKER] Found ${failedEmails.length} failed notifications to retry.`);
      for (const log of failedEmails) {
        log.retryCount += 1;
        // Attempt resend
        const result = await sendEmail({
          to: log.recipient,
          subject: log.subject,
          html: log.body,
          orderId: log.orderId,
        });
        if (result.success) {
          log.status = 'sent';
        } else {
          log.errorDetails = result.error ? result.error.message : 'Retry failed';
        }
        await log.save();
      }
    }
  } catch (err) {
    console.error('[EMAIL RETRY WORKER] Error during execution:', err.message);
  }
};
setInterval(cronEmailRetry, 60000);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
