const nodemailer = require('nodemailer');
const NotificationLog = require('../models/NotificationLog');

/**
 * Send a real email via Nodemailer and log the delivery to NotificationLog.
 * @param {Object} options - { to, subject, text, html, orderId }
 */
const sendEmail = async ({ to, subject, text, html, orderId = null }) => {
  let transporter;

  const isRealConfig = process.env.SMTP_USER && process.env.SMTP_USER !== 'mockuser';

  if (process.env.SMTP_SERVICE === 'gmail' && isRealConfig) {
    // Gmail Transport configuration
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // 16-character App Password
      },
    });
  } else if (isRealConfig) {
    // Custom SMTP Transport configuration (Outlook, Brevo, SendGrid, Mailtrap, etc.)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    // Auto-generate test account using Ethereal if no real credentials configured
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.warn('[EMAIL] Test SMTP creation warning:', err.message);
    }
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@nelmani.com',
    to,
    subject,
    text: text || html.replace(/<[^>]*>/g, ''),
    html,
  };

  if (!transporter) {
    console.log(`[MOCK EMAIL SENT] To: ${to} | Subject: ${subject}`);
    try {
      const log = new NotificationLog({
        orderId,
        recipient: to,
        subject,
        body: html || text,
        status: 'sent',
      });
      await log.save();
    } catch (e) {
      console.error('Failed to save notification log:', e.message);
    }
    return { success: true, message: 'Mock email logged.' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[REAL EMAIL DISPATCHED] To: ${to} | MessageID: ${info.messageId}`);
    
    // Log success in DB
    const log = new NotificationLog({
      orderId,
      recipient: to,
      subject,
      body: html || text,
      status: 'sent',
    });
    await log.save();

    // If Ethereal test account was used, print test preview URL
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`[ETHEREAL TEST EMAIL PREVIEW]: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return { success: true, info };
  } catch (error) {
    console.error(`[EMAIL DELIVERY FAILED] To: ${to} | Error: ${error.message}`);
    
    // Log failure in DB for retry queue
    const log = new NotificationLog({
      orderId,
      recipient: to,
      subject,
      body: html || text,
      status: 'failed',
      errorDetails: error.message,
    });
    await log.save();

    return { success: false, error };
  }
};

module.exports = sendEmail;
