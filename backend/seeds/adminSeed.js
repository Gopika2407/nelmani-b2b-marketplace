const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const PricingRule = require('../models/PricingRule');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nelmani');
    console.log('MongoDB connected for seeding...');
  } catch (err) {
    console.error('Error connecting to DB for seed:', err.message);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  try {
    // 1. Seed Admin
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
      console.log('Admin user seeded: email: admin@nelmani.com, password: admin123, userId: NEL-ADM-001');
    } else {
      console.log('Admin user already exists.');
    }

    // 2. Seed Default Pricing Rules
    const defaultCategories = ['Cardamom', 'Black Pepper', 'Turmeric', 'Clove', 'Ginger'];
    for (const cat of defaultCategories) {
      const ruleExists = await PricingRule.findOne({ category: cat });
      if (!ruleExists) {
        const newRule = new PricingRule({
          category: cat,
          marginPercent: 5, // 5% default margin
          flatFee: 10,      // $10 or Rs 10 flat fee per unit (kg)
          volumeFeePercent: 1.5, // 1.5% admin volume fee
          commissionPercent: 1,  // 1% transaction commission
        });
        await newRule.save();
        console.log(`Seeded pricing rule for category: ${cat}`);
      }
    }

    const globalDefault = await PricingRule.findOne({ category: 'default' });
    if (!globalDefault) {
      const newRule = new PricingRule({
        category: 'default',
        marginPercent: 3,
        flatFee: 5,
        volumeFeePercent: 1,
        commissionPercent: 1,
      });
      await newRule.save();
      console.log('Seeded global default pricing rule');
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
