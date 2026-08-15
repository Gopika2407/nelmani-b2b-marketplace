const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  rawPrice: {
    type: Number,
    required: true,
  },
  livePrice: {
    type: Number,
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
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
