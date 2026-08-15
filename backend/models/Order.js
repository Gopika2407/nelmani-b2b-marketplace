const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  negotiatedPrice: {
    type: Number,
    required: true, // The final price charged to the buyer (price per unit)
  },
  supplierPayoutPrice: {
    type: Number,
    required: true, // The price paid to the supplier (raw price per unit)
  },
  totalAmount: {
    type: Number, // negotiatedPrice * quantity
    required: true,
  },
  shippingAddress: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['placed', 'routed', 'pending_quality_approval', 'confirmed', 'packed', 'dispatched', 'delivered', 'rejected', 'cancelled'],
    default: 'placed',
  },
  deliveryPartner: {
    type: String,
    default: 'Rail-Express Placeholder',
  },
  trackingId: {
    type: String,
  },
  dispatchDate: {
    type: Date,
  },
  expectedDeliveryDate: {
    type: Date,
  },
  packagingType: {
    type: String,
  },
  packagingCost: {
    type: Number,
    default: 0,
  },
  statusHistory: [
    {
      status: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      remarks: String,
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
