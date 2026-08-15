const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  recipient: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['sent', 'failed'],
    default: 'sent',
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  errorDetails: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
