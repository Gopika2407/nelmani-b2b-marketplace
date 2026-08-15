const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  gradeClass: {
    type: String,
    required: true,
    trim: true,
  },
  rawPrice: {
    type: Number,
    required: true,
  },
  rawMOQ: {
    type: Number,
    required: true,
  },
  origin: {
    type: String,
    required: true,
    trim: true,
  },
  region: {
    type: String,
    required: true,
    trim: true,
  },
  moisturePercent: {
    type: Number,
    required: true,
  },
  purityPercent: {
    type: Number,
    required: true,
  },
  images: [String],
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Future Auction Placeholders
  auctionEnabled: {
    type: Boolean,
    default: false,
  },
  biddingWindow: {
    type: Date,
  },
  currentHighestBid: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
