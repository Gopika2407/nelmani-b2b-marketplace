const mongoose = require('mongoose');

const revenueLedgerSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true, // Only one ledger entry per order
  },
  grossRevenue: {
    type: Number,
    required: true, // Margin + flat fee + volume fee + commission
  },
  marginAmount: {
    type: Number,
    required: true, // (negotiatedPrice - supplierPayoutPrice) * quantity (excluding fees) or including them
  },
  volumeFee: {
    type: Number,
    default: 0,
  },
  commissionAmount: {
    type: Number,
    default: 0,
  },
  expenses: {
    type: Number,
    default: 0, // Packaging + logistics + ops
  },
  netProfit: {
    type: Number,
    required: true, // grossRevenue - expenses
  },
  date: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model('RevenueLedger', revenueLedgerSchema);
