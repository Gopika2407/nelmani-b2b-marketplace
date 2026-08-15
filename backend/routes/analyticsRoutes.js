const express = require('express');
const router = express.Router();
const RevenueLedger = require('../models/RevenueLedger');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get ledger details and aggregate summaries (Admin only)
// @route   GET /api/analytics/ledger
// @access  Private/Admin
router.get('/ledger', protect, authorize('admin'), async (req, res) => {
  try {
    const ledgerEntries = await RevenueLedger.find()
      .populate({
        path: 'orderId',
        populate: { path: 'productId', select: 'name category gradeClass' }
      })
      .sort({ createdAt: -1 });

    // Aggregate statistics
    const totals = await RevenueLedger.aggregate([
      {
        $group: {
          _id: null,
          totalGrossRevenue: { $sum: '$grossRevenue' },
          totalMarginAmount: { $sum: '$marginAmount' },
          totalVolumeFee: { $sum: '$volumeFee' },
          totalCommissionAmount: { $sum: '$commissionAmount' },
          totalExpenses: { $sum: '$expenses' },
          totalNetProfit: { $sum: '$netProfit' },
          avgNetProfit: { $avg: '$netProfit' },
          orderCount: { $sum: 1 },
        }
      }
    ]);

    const stats = totals[0] || {
      totalGrossRevenue: 0,
      totalMarginAmount: 0,
      totalVolumeFee: 0,
      totalCommissionAmount: 0,
      totalExpenses: 0,
      totalNetProfit: 0,
      avgNetProfit: 0,
      orderCount: 0,
    };

    res.json({
      success: true,
      stats,
      data: ledgerEntries,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get revenue trends over time (Admin only)
// @route   GET /api/analytics/trends
// @access  Private/Admin
router.get('/trends', protect, authorize('admin'), async (req, res) => {
  const { interval } = req.query; // 'daily', 'weekly', 'monthly' (default daily)

  let groupFormat = '%Y-%m-%d'; // default daily
  if (interval === 'monthly') {
    groupFormat = '%Y-%m';
  } else if (interval === 'weekly') {
    groupFormat = '%Y-W%V'; // ISO Week format
  }

  try {
    const trends = await RevenueLedger.aggregate([
      {
        $project: {
          formattedDate: { $dateToString: { format: groupFormat, date: '$date' } },
          grossRevenue: 1,
          expenses: 1,
          netProfit: 1,
          marginAmount: 1,
        }
      },
      {
        $group: {
          _id: '$formattedDate',
          grossRevenue: { $sum: '$grossRevenue' },
          expenses: { $sum: '$expenses' },
          netProfit: { $sum: '$netProfit' },
          marginAmount: { $sum: '$marginAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } } // Sort chronologically
    ]);

    res.json({
      success: true,
      interval: interval || 'daily',
      data: trends
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
