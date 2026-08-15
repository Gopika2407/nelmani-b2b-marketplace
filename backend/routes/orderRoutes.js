const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const PricingRule = require('../models/PricingRule');
const QualityApproval = require('../models/QualityApproval');
const RevenueLedger = require('../models/RevenueLedger');
const User = require('../models/User');
const Company = require('../models/Company');
const { protect, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

// Utility to format orders based on user roles (data isolation at API layer)
const formatOrder = (order, role) => {
  const oObj = order.toObject ? order.toObject() : order;

  if (role === 'buyer') {
    // Hide supplier information and raw payout prices from buyers
    delete oObj.supplierId;
    delete oObj.supplierPayoutPrice;
    if (oObj.productId && oObj.productId.supplierId) {
      delete oObj.productId.supplierId;
      delete oObj.productId.rawPrice;
      delete oObj.productId.rawMOQ;
      delete oObj.productId.origin;
    }
  } else if (role === 'supplier') {
    // Hide buyer details and admin margins/negotiated prices from suppliers
    delete oObj.buyerId;
    delete oObj.negotiatedPrice;
    delete oObj.totalAmount;
    delete oObj.shippingAddress; // Hide specific street address, show general region on request
    if (oObj.productId) {
      delete oObj.productId.rawPrice;
      delete oObj.productId.rawMOQ;
      delete oObj.productId.origin;
    }
    // Present supplier payout total
    oObj.supplierPayoutTotal = Math.round((oObj.supplierPayoutPrice * oObj.quantity) * 100) / 100;
  }
  // Admin sees everything
  return oObj;
};

// @desc    Place a new order (Buyer only)
// @route   POST /api/orders
// @access  Private (Buyer)
router.post('/', protect, authorize('buyer'), async (req, res) => {
  const { productId, quantity, shippingAddress } = req.body;

  if (!productId || !quantity || !shippingAddress) {
    return res.status(400).json({ success: false, message: 'Please provide productId, quantity, and shippingAddress' });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Validate MOQ (buyer-facing, which equals rawMOQ)
    if (quantity < product.rawMOQ) {
      return res.status(400).json({ 
        success: false, 
        message: `Quantity (${quantity}) is less than the Minimum Order Quantity (${product.rawMOQ})` 
      });
    }

    // Retrieve pricing rule to calculate buyer price
    const rules = await PricingRule.find();
    const rule = rules.find(r => r.category === product.category) || 
                 rules.find(r => r.category === 'default') || 
                 { marginPercent: 0, flatFee: 0 };

    const marginAmount = (product.rawPrice * (rule.marginPercent || 0) / 100) + (rule.flatFee || 0);
    const negotiatedPrice = product.rawPrice + marginAmount;
    const totalAmount = negotiatedPrice * quantity;

    const order = new Order({
      buyerId: req.user._id,
      productId: product._id,
      supplierId: product.supplierId,
      quantity,
      negotiatedPrice,
      supplierPayoutPrice: product.rawPrice,
      totalAmount,
      shippingAddress,
      status: 'placed',
      statusHistory: [
        {
          status: 'placed',
          updatedBy: req.user._id,
          remarks: 'Order placed by buyer',
        }
      ]
    });

    await order.save();

    // Trigger Notification: Buyer got "order received"
    await sendEmail({
      to: req.user.email,
      subject: `NELMANI - Order Received: #${order._id.toString().substring(18)}`,
      html: `<h3>Thank you for your order!</h3>
             <p>Your order for <strong>${product.name}</strong> (${quantity} kg) has been received and routed to our OMS team.</p>
             <p>We are matching with high-quality producers and verifying grade specifications.</p>
             <p><strong>Order ID:</strong> ${order._id}<br/><strong>Total Price (Estimated):</strong> Rs. ${totalAmount}</p>`,
      orderId: order._id
    });

    // Trigger Notification: Admin got "new order" alert
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `[ALERT] New Order Placed - Order #${order._id.toString().substring(18)}`,
        html: `<p>A buyer has placed a new order for ${product.name}.</p>
               <p><strong>Quantity:</strong> ${quantity} kg</p>
               <p>Please route this order in the Admin Dashboard.</p>`,
        orderId: order._id
      });
    }

    res.status(201).json({ success: true, data: formatOrder(order, 'buyer') });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get orders (Isolated by roles)
// @route   GET /api/orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'buyer') {
      query.buyerId = req.user._id;
    } else if (req.user.role === 'supplier') {
      query.supplierId = req.user._id;
      // Suppliers should only see orders that are "routed" or further along, not raw "placed" orders before admin routing.
      query.status = { $ne: 'placed' };
    }

    const orders = await Order.find(query)
      .populate('productId', 'name category gradeClass rawPrice rawMOQ origin region')
      .sort({ createdAt: -1 });

    const formatted = orders.map(o => formatOrder(o, req.user.role));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('productId', 'name category gradeClass rawPrice rawMOQ origin region');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Role checks
    if (req.user.role === 'buyer' && order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }
    if (req.user.role === 'supplier' && order.supplierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({ success: true, data: formatOrder(order, req.user.role) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Update order status / state machine (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), async (req, res) => {
  const { status, remarks, deliveryPartner, trackingId, dispatchDate, expectedDeliveryDate, packagingType, packagingCost } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, message: 'Please specify new status' });
  }

  const validStatuses = ['placed', 'routed', 'pending_quality_approval', 'confirmed', 'packed', 'dispatched', 'delivered', 'rejected', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.status;

    // Apply state machine validations: e.g. cannot jump to delivered straight from placed
    if (status === 'delivered' && !['dispatched', 'confirmed', 'packed'].includes(previousStatus)) {
      return res.status(400).json({ success: false, message: `Cannot transition directly from ${previousStatus} to delivered.` });
    }

    // Update logistics placeholder fields if supplied
    if (deliveryPartner) order.deliveryPartner = deliveryPartner;
    if (trackingId) order.trackingId = trackingId;
    if (dispatchDate) order.dispatchDate = dispatchDate;
    if (expectedDeliveryDate) order.expectedDeliveryDate = expectedDeliveryDate;
    if (packagingType) order.packagingType = packagingType;
    if (packagingCost !== undefined) order.packagingCost = packagingCost;

    order.status = status;
    order.statusHistory.push({
      status,
      updatedBy: req.user._id,
      remarks: remarks || `Order moved to ${status} by Admin`,
    });

    await order.save();

    // Fetch related users for notification triggers
    const buyer = await User.findById(order.buyerId);
    const supplier = await User.findById(order.supplierId);
    const product = await Product.findById(order.productId);

    // ================== TRIGGER EMAILS BASED ON STATE ==================
    if (status === 'routed') {
      // 1. Notify supplier: Prepare Stock (No buyer identity revealed)
      await sendEmail({
        to: supplier.email,
        subject: `[NELMANI] Action Required: Prepare stock for Order #${order._id.toString().substring(18)}`,
        html: `<h3>New Order Matched!</h3>
               <p>An order has been routed to you for fulfillment. Please verify and package the stock:</p>
               <ul>
                 <li><strong>Product:</strong> ${product.name}</li>
                 <li><strong>Grade:</strong> ${product.gradeClass}</li>
                 <li><strong>Quantity:</strong> ${order.quantity} kg</li>
                 <li><strong>Your Payout Rate:</strong> Rs. ${order.supplierPayoutPrice} / kg</li>
                 <li><strong>Your Total Payout:</strong> Rs. ${order.supplierPayoutPrice * order.quantity}</li>
               </ul>
               <p>Please log in to your dashboard to confirm preparation and drop-off instructions to the rail-logistics hub.</p>`,
        orderId: order._id
      });

      // 2. Notify buyer: Order routed & matched
      await sendEmail({
        to: buyer.email,
        subject: `NELMANI - Order Update: Match Confirmed #${order._id.toString().substring(18)}`,
        html: `<h3>Your order has been routed!</h3>
               <p>We have matched your order with a verified regional supplier for <strong>${product.name}</strong>.</p>
               <p>The stock is currently being prepared for quality inspection at our consolidation hub.</p>`,
        orderId: order._id
      });
    }

    else if (status === 'pending_quality_approval') {
      // Alert quality team or log update to buyer
      await sendEmail({
        to: buyer.email,
        subject: `NELMANI - Order Update: Quality Check Pending`,
        html: `<p>Your batch of ${product.name} has arrived at our testing hub. Our quality control team is performing moisture and purity analyses.</p>`,
        orderId: order._id
      });
    }

    else if (status === 'confirmed') {
      // Admin finalized order details. This expects quality audit setup.
      // Let's create an automated Quality Log if it doesn't exist
      const checkQuality = await QualityApproval.findOne({ orderId: order._id });
      if (!checkQuality) {
        // Create auto-pass mock record if none exists for demo convenience
        const autoPass = new QualityApproval({
          orderId: order._id,
          approvedBy: req.user._id,
          moisturePercent: product.moisturePercent,
          purityPercent: product.purityPercent,
          approved: true,
          remarks: 'Auto-approved on confirmation',
        });
        await autoPass.save();
      }

      // Generate Revenue Ledger entry
      const pricingRule = await PricingRule.findOne({ category: product.category }) || 
                          await PricingRule.findOne({ category: 'default' }) || 
                          { marginPercent: 0, flatFee: 0, volumeFeePercent: 0, commissionPercent: 0 };
      
      const marginAmount = (order.negotiatedPrice - order.supplierPayoutPrice) * order.quantity;
      const volumeFeeVal = (pricingRule.volumeFeePercent / 100) * order.totalAmount;
      const commissionVal = (pricingRule.commissionPercent / 100) * order.totalAmount;
      const grossRevenue = marginAmount + volumeFeeVal + commissionVal;
      const expenses = (order.packagingCost || 0) + 1500; // Mock logistics flat transport fee of 1500

      const netProfit = grossRevenue - expenses;

      // Update Ledger
      await RevenueLedger.findOneAndUpdate(
        { orderId: order._id },
        {
          grossRevenue: Math.round(grossRevenue * 100) / 100,
          marginAmount: Math.round(marginAmount * 100) / 100,
          volumeFee: Math.round(volumeFeeVal * 100) / 100,
          commissionAmount: Math.round(commissionVal * 100) / 100,
          expenses,
          netProfit: Math.round(netProfit * 100) / 100,
        },
        { upsert: true, new: true }
      );

      // Email Buyer: Final confirmation & Price Fixed
      await sendEmail({
        to: buyer.email,
        subject: `NELMANI - Order Confirmed! #${order._id.toString().substring(18)}`,
        html: `<h3>Your order is officially confirmed!</h3>
               <p>Our quality checks have passed. Price and logistics are now locked in.</p>
               <ul>
                 <li><strong>Product:</strong> ${product.name}</li>
                 <li><strong>Quantity:</strong> ${order.quantity} kg</li>
                 <li><strong>Final Total Price:</strong> Rs. ${order.totalAmount}</li>
                 <li><strong>Logistics Service:</strong> ${order.deliveryPartner}</li>
               </ul>
               <p>Payment terms and shipping dispatch timelines are detailed in your merchant panel.</p>`,
        orderId: order._id
      });

      // Email Supplier: Shipment instructions
      await sendEmail({
        to: supplier.email,
        subject: `NELMANI - Order Confirmed for Dispatch #${order._id.toString().substring(18)}`,
        html: `<h3>Fulfillment Instructions:</h3>
               <p>Order #${order._id} for ${product.name} (${order.quantity} kg) is approved for dispatch.</p>
               <p>Please deliver the packaged stock to the specified Rail-Logistics hub.</p>`,
        orderId: order._id
      });
    }

    else if (status === 'dispatched') {
      // Email Buyer: Order shipped + Tracking
      await sendEmail({
        to: buyer.email,
        subject: `NELMANI - Order Dispatched! Tracking ID: ${order.trackingId || 'N/A'}`,
        html: `<h3>Your cargo is on the move!</h3>
               <p>Your order for ${product.name} has been dispatched via <strong>${order.deliveryPartner}</strong>.</p>
               <p><strong>Tracking Reference:</strong> ${order.trackingId || 'Pending'}</p>
               <p><strong>Expected Delivery:</strong> ${order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : 'TBD'}</p>`,
        orderId: order._id
      });
    }

    else if (status === 'delivered') {
      // Email Buyer: Delivery completed
      await sendEmail({
        to: buyer.email,
        subject: `NELMANI - Order Delivered successfully`,
        html: `<h3>Delivery Successful!</h3>
               <p>Your shipment of ${product.name} has been marked as delivered at your warehouse.</p>
               <p>Please review and confirm quality receipt in your merchant panel.</p>`,
        orderId: order._id
      });
    }

    res.json({ success: true, message: `Status updated successfully to ${status}`, data: formatOrder(order, 'admin') });
  } catch (err) {
    console.error('Status transition error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Admin logs custom quality inspection results
// @route   POST /api/orders/:id/quality
// @access  Private/Admin
router.post('/:id/quality', protect, authorize('admin'), async (req, res) => {
  const { moisturePercent, purityPercent, approved, remarks } = req.body;

  if (moisturePercent === undefined || purityPercent === undefined || approved === undefined) {
    return res.status(400).json({ success: false, message: 'Please provide moisturePercent, purityPercent, and approval outcome' });
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const qualityLog = new QualityApproval({
      orderId: order._id,
      approvedBy: req.user._id,
      moisturePercent,
      purityPercent,
      approved,
      remarks,
    });
    await qualityLog.save();

    // If quality failed, reject the order automatically or flag it
    if (!approved) {
      order.status = 'rejected';
      order.statusHistory.push({
        status: 'rejected',
        updatedBy: req.user._id,
        remarks: `Quality failed: Moisture ${moisturePercent}%, Purity ${purityPercent}%. Remarks: ${remarks}`,
      });
      await order.save();
    } else {
      order.status = 'pending_quality_approval'; // Retain or proceed
      await order.save();
    }

    res.status(201).json({ success: true, message: 'Quality evaluation recorded.', data: qualityLog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
