const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const sendEmail = require('../utils/sendEmail');

const targetEmail = process.argv[2] || 'test@example.com';

const test = async () => {
  console.log(`\n--- NELMANI SMTP Email Test ---`);
  console.log(`Target Recipient: ${targetEmail}`);
  console.log(`Configured Sender: ${process.env.SMTP_USER || process.env.EMAIL_FROM}`);
  console.log(`SMTP Service/Host: ${process.env.SMTP_SERVICE || process.env.SMTP_HOST}`);

  // Connect to DB for notification log storage
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nelmani');
    console.log(`[DB] Connected to MongoDB for notification logging.`);
  } catch (err) {
    console.warn(`[DB WARNING] Database connection error: ${err.message}`);
  }

  console.log(`\nSending email to ${targetEmail}... please wait...\n`);

  const result = await sendEmail({
    to: targetEmail,
    subject: 'NELMANI Test Email - Real Inbox Delivery Verification',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #0b120e; color: #f3f4f6; border-radius: 12px; border: 1px solid #f59e0b;">
        <h2 style="color: #f59e0b; margin-top: 0;">NELMANI Agri-Exchange Email Verification</h2>
        <p>This is a real email test confirming that your Nodemailer SMTP email configuration is active and delivering emails to real recipient inboxes!</p>
        <p style="background-color: #10b98122; border: 1px solid #10b981; padding: 10px; border-radius: 6px; color: #34d399;">
          <strong>Status:</strong> REAL EMAIL DISPATCH SUCCESSFUL
        </p>
      </div>
    `,
  });

  if (result.success) {
    console.log(`\n SUCCESS! Email dispatched successfully.`);
    console.log(`Check the inbox (and spam folder) of: ${targetEmail}\n`);
  } else {
    console.error(`\n FAILED to send email.`);
    console.error(`Error details:`, result.error?.message || result.error);
  }

  process.exit(0);
};

test();
