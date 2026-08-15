const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

// Models for auto-seeding
const User = require('./models/User');
const PricingRule = require('./models/PricingRule');

// Load env vars
dotenv.config();

// Auto-seed admin user and default pricing rules if missing
const autoSeedAdmin = async () => {
  try {
    const adminEmail = 'admin@nelmani.com';
    const adminExists = await User.findOne({ role: 'admin' });

    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const adminUser = new User({
        userId: 'NEL-ADM-001',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        status: 'approved',
        isApproved: true,
      });

      await adminUser.save();
      console.log('[AUTO-SEED] Created Admin user: admin@nelmani.com / admin123');
    }

    const defaultCategories = ['Cardamom', 'Black Pepper', 'Turmeric', 'Clove', 'Ginger', 'default'];
    for (const cat of defaultCategories) {
      const ruleExists = await PricingRule.findOne({ category: cat });
      if (!ruleExists) {
        await PricingRule.create({
          category: cat,
          marginPercent: 5,
          flatFee: 10,
          volumeFeePercent: 1.5,
          commissionPercent: 1,
        });
      }
    }
  } catch (err) {
    console.error('[AUTO-SEED ERROR]', err.message);
  }
};

// Connect to Database
connectDB().then(() => {
  autoSeedAdmin();
});

const app = express();

// Express middlewares
app.use(express.json());
app.use(cookieParser());

// Enable CORS for web and mobile clients
app.use(cors({
  origin: true,
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
