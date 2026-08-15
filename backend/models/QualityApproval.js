const mongoose = require('mongoose');

const qualityApprovalSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  moisturePercent: {
    type: Number,
    required: true,
  },
  purityPercent: {
    type: Number,
    required: true,
  },
  approved: {
    type: Boolean,
    default: false,
  },
  remarks: {
    type: String,
    trim: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('QualityApproval', qualityApprovalSchema);
