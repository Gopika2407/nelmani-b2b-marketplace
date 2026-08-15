const mongoose = require('mongoose');

const pricingRuleSchema = new mongoose.Schema({
  category: {
    type: String,
    unique: true, // Unique pricing rule per category or 'default'
    required: true,
  },
  marginPercent: {
    type: Number,
    default: 0,
  },
  flatFee: {
    type: Number,
    default: 0,
  },
  volumeFeePercent: {
    type: Number,
    default: 0,
  },
  commissionPercent: {
    type: Number,
    default: 0,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });

module.exports = mongoose.model('PricingRule', pricingRuleSchema);
