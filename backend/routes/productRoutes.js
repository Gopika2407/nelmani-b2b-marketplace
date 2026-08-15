const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const PricingRule = require('../models/PricingRule');
const PriceHistory = require('../models/PriceHistory');
const { protect, authorize } = require('../middleware/auth');

// Utility function to dynamically format prices and strip hidden fields
const formatProduct = (product, role, rules) => {
  const pObj = product.toObject ? product.toObject() : product;

  // Find appropriate rule
  const rule = rules.find(r => r.category === pObj.category) || 
               rules.find(r => r.category === 'default') || 
               { marginPercent: 0, flatFee: 0 };

  const marginAmount = (pObj.rawPrice * (rule.marginPercent || 0) / 100) + (rule.flatFee || 0);
  const livePrice = Math.round((pObj.rawPrice + marginAmount) * 100) / 100;

  if (role === 'buyer') {
    // Enforce data masking rules: strip sensitive supplier data at API layer
    delete pObj.rawPrice;
    delete pObj.rawMOQ;
    delete pObj.origin;
    delete pObj.supplierId;

    pObj.liveMarketPrice = livePrice;
    pObj.buyerMOQ = product.rawMOQ; // expose MOQ field to buyers as buyerMOQ
  } else if (role === 'supplier') {
    pObj.liveMarketPrice = livePrice;
    pObj.buyerMOQ = product.rawMOQ;
  } else {
    // Admin gets all fields plus dynamic margin metadata
    pObj.liveMarketPrice = livePrice;
    pObj.buyerMOQ = product.rawMOQ;
    pObj.marginAmount = Math.round(marginAmount * 100) / 100;
  }

  return pObj;
};

// @desc    Get all products (Masked for buyers, full detail for suppliers/admin)
// @route   GET /api/products
// @access  Private (Registered and approved users)
router.get('/', protect, async (req, res) => {
  try {
    const rules = await PricingRule.find();
    let query = {};

    // Suppliers can filter to see only their uploaded stocks
    if (req.user.role === 'supplier' && req.query.myStock === 'true') {
      query.supplierId = req.user._id;
    }

    const products = await Product.find(query);

    const formatted = products.map(p => {
      // If supplier is viewing other products (not theirs), mask details
      const isOwner = req.user.role === 'supplier' && p.supplierId.toString() === req.user._id.toString();
      const currentRole = (req.user.role === 'supplier' && !isOwner) ? 'buyer' : req.user.role;
      return formatProduct(p, currentRole, rules);
    });

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get single product details
// @route   GET /api/products/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const rules = await PricingRule.find();
    const isOwner = req.user.role === 'supplier' && product.supplierId.toString() === req.user._id.toString();
    const currentRole = (req.user.role === 'supplier' && !isOwner) ? 'buyer' : req.user.role;

    const formatted = formatProduct(product, currentRole, rules);
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Create a product stock (Supplier / Admin only)
// @route   POST /api/products
// @access  Private (Supplier/Admin)
router.post('/', protect, authorize('supplier', 'admin'), async (req, res) => {
  const { name, category, gradeClass, rawPrice, rawMOQ, origin, region, moisturePercent, purityPercent, images } = req.body;

  if (!name || !category || !gradeClass || !rawPrice || !rawMOQ || !origin || !region || moisturePercent === undefined || purityPercent === undefined) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  try {
    const product = new Product({
      name,
      category,
      gradeClass,
      rawPrice,
      rawMOQ,
      origin,
      region,
      moisturePercent,
      purityPercent,
      images: images || [],
      supplierId: req.user.role === 'admin' && req.body.supplierId ? req.body.supplierId : req.user._id,
    });

    await product.save();

    // Log the initial price configuration in PriceHistory
    const rules = await PricingRule.find();
    const rule = rules.find(r => r.category === category) || rules.find(r => r.category === 'default') || { marginPercent: 0, flatFee: 0 };
    const marginAmount = (rawPrice * (rule.marginPercent || 0) / 100) + (rule.flatFee || 0);
    const livePrice = rawPrice + marginAmount;

    const history = new PriceHistory({
      productId: product._id,
      rawPrice,
      livePrice,
      marginPercent: rule.marginPercent,
      flatFee: rule.flatFee,
      updatedBy: req.user._id,
    });
    await history.save();

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Update a product stock
// @route   PUT /api/products/:id
// @access  Private (Supplier/Admin)
router.put('/:id', protect, authorize('supplier', 'admin'), async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Verify ownership
    if (req.user.role === 'supplier' && product.supplierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this stock' });
    }

    const { rawPrice, category } = req.body;
    const priceChanged = rawPrice && parseFloat(rawPrice) !== product.rawPrice;

    // Perform update
    const allowedUpdates = [
      'name', 'category', 'gradeClass', 'rawPrice', 'rawMOQ', 
      'origin', 'region', 'moisturePercent', 'purityPercent', 'images'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();

    // If raw price has changed, audit log in PriceHistory
    if (priceChanged) {
      const rules = await PricingRule.find();
      const cat = category || product.category;
      const rule = rules.find(r => r.category === cat) || rules.find(r => r.category === 'default') || { marginPercent: 0, flatFee: 0 };
      const marginAmount = (product.rawPrice * (rule.marginPercent || 0) / 100) + (rule.flatFee || 0);
      const livePrice = product.rawPrice + marginAmount;

      const history = new PriceHistory({
        productId: product._id,
        rawPrice: product.rawPrice,
        livePrice,
        marginPercent: rule.marginPercent,
        flatFee: rule.flatFee,
        updatedBy: req.user._id,
      });
      await history.save();
      console.log(`Audited price change for product: ${product.name}`);
    }

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get pricing rules (Admin only)
// @route   GET /api/admin/pricing-rules
// @access  Private/Admin
router.get('/admin/pricing-rules', protect, authorize('admin'), async (req, res) => {
  try {
    const rules = await PricingRule.find();
    res.json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Configure/Update margin rules (Admin only)
// @route   POST /api/admin/pricing-rules
// @access  Private/Admin
router.post('/admin/pricing-rules', protect, authorize('admin'), async (req, res) => {
  const { category, marginPercent, flatFee, volumeFeePercent, commissionPercent } = req.body;

  if (!category) {
    return res.status(400).json({ success: false, message: 'Please specify category' });
  }

  try {
    let rule = await PricingRule.findOne({ category });

    if (rule) {
      if (marginPercent !== undefined) rule.marginPercent = marginPercent;
      if (flatFee !== undefined) rule.flatFee = flatFee;
      if (volumeFeePercent !== undefined) rule.volumeFeePercent = volumeFeePercent;
      if (commissionPercent !== undefined) rule.commissionPercent = commissionPercent;
      rule.updatedBy = req.user._id;
      await rule.save();
    } else {
      rule = new PricingRule({
        category,
        marginPercent: marginPercent || 0,
        flatFee: flatFee || 0,
        volumeFeePercent: volumeFeePercent || 0,
        commissionPercent: commissionPercent || 0,
        updatedBy: req.user._id,
      });
      await rule.save();
    }

    // Trigger priceHistory updates for existing products in this category to track updates
    const products = await Product.find({ category });
    const rulesList = await PricingRule.find();
    for (const prod of products) {
      const marginVal = (prod.rawPrice * (rule.marginPercent || 0) / 100) + (rule.flatFee || 0);
      const livePrice = prod.rawPrice + marginVal;
      
      const history = new PriceHistory({
        productId: prod._id,
        rawPrice: prod.rawPrice,
        livePrice,
        marginPercent: rule.marginPercent,
        flatFee: rule.flatFee,
        updatedBy: req.user._id,
      });
      await history.save();
    }

    res.json({ success: true, message: 'Pricing configurations updated successfully.', data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get historical price log of a product for chart trend line
// @route   GET /api/products/:id/trends
// @access  Private
router.get('/:id/trends', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const logs = await PriceHistory.find({ productId: req.params.id }).sort({ createdAt: 1 });
    
    // Mask raw pricing log for buyers
    const isOwner = req.user.role === 'supplier' && product.supplierId.toString() === req.user._id.toString();
    const mask = req.user.role === 'buyer' || (req.user.role === 'supplier' && !isOwner);

    const formattedLogs = logs.map(l => {
      const obj = l.toObject();
      if (mask) {
        delete obj.rawPrice;
      }
      return obj;
    });

    res.json({ success: true, data: formattedLogs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
