const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const { protect, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

// GST Regex check
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// @desc    Register a new supplier or buyer
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { email, password, role, companyName, gstNumber, contactNumber, address } = req.body;

  if (!email || !password || !role || !companyName || !gstNumber || !contactNumber || !address) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  if (role !== 'supplier' && role !== 'buyer') {
    return res.status(400).json({ success: false, message: 'Invalid role. Must be supplier or buyer' });
  }

  // Validate GST
  const upperGST = gstNumber.toUpperCase();
  if (!gstRegex.test(upperGST)) {
    return res.status(400).json({ success: false, message: 'Invalid GST format (Example: 27AAAAA1111A1Z1)' });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Check if GST is unique
    const gstExists = await Company.findOne({ gstNumber: upperGST });
    if (gstExists) {
      return res.status(400).json({ success: false, message: 'Company with this GST number already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const user = new User({
      email,
      password: hashedPassword,
      role,
      status: 'pending',
      isApproved: false,
    });
    await user.save();

    // Create Company
    const company = new Company({
      userId: user._id,
      companyName,
      gstNumber: upperGST,
      contactNumber,
      address,
    });
    await company.save();

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Pending administrator approval.',
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Admin approve/reject a pending registration
// @route   POST /api/auth/approve
// @access  Private/Admin
router.post('/approve', protect, authorize('admin'), async (req, res) => {
  const { targetUserId, action } = req.body; // action: 'approve' or 'reject'

  if (!targetUserId || !action) {
    return res.status(400).json({ success: false, message: 'Please provide targetUserId and action' });
  }

  try {
    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ success: false, message: `User already has status: ${user.status}` });
    }

    if (action === 'reject') {
      user.status = 'rejected';
      await user.save();
      
      // Notify via email
      await sendEmail({
        to: user.email,
        subject: 'NELMANI - Registration Status Update',
        html: `<h3>Dear Merchant,</h3><p>We regret to inform you that your registration application for the NELMANI platform has been rejected. Please verify your details or contact admin support.</p>`,
      });

      return res.json({ success: true, message: 'User registration rejected.' });
    }

    if (action === 'approve') {
      // Generate unique userId
      const prefix = user.role === 'supplier' ? 'SUP' : 'BUY';
      
      // Find the last user with this role prefix to increment safely
      const lastUser = await User.findOne({
        role: user.role,
        userId: new RegExp(`^NEL-${prefix}-`),
      }).sort({ userId: -1 });

      let num = 1;
      if (lastUser && lastUser.userId) {
        const parts = lastUser.userId.split('-');
        const lastNum = parseInt(parts[2]);
        if (!isNaN(lastNum)) {
          num = lastNum + 1;
        }
      }

      const generatedId = `NEL-${prefix}-${String(num).padStart(3, '0')}`;
      
      user.userId = generatedId;
      user.status = 'approved';
      user.isApproved = true;
      await user.save();

      const company = await Company.findOne({ userId: user._id });

      // Notify user via email
      await sendEmail({
        to: user.email,
        subject: 'NELMANI - Account Approved!',
        html: `<h3>Congratulations!</h3>
               <p>Your business profile for <strong>${company ? company.companyName : 'your firm'}</strong> has been verified and approved.</p>
               <p>Your unique Merchant credentials:</p>
               <ul>
                 <li><strong>User ID:</strong> ${generatedId}</li>
                 <li><strong>GST Number:</strong> ${company ? company.gstNumber : 'Your registered GST'}</li>
               </ul>
               <p>Use these credentials to login and receive your OTP code to complete authentication.</p>`,
      });

      return res.json({
        success: true,
        message: `User approved successfully. Assigned ID: ${generatedId}`,
      });
    }

    res.status(400).json({ success: false, message: 'Invalid action. Use approve or reject.' });
  } catch (err) {
    console.error('Approval error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Initiate Login (User ID + GST -> Generate OTP)
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { userId, gstNumber } = req.body;

  if (!userId || !gstNumber) {
    return res.status(400).json({ success: false, message: 'Please provide User ID and GST Number' });
  }

  try {
    const upperGST = gstNumber.toUpperCase();
    
    // Find user by userId
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials or user not approved' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ success: false, message: 'Your account is pending administrator approval.' });
    }

    // Verify company association and GST
    const company = await Company.findOne({ userId: user._id, gstNumber: upperGST });
    if (!company) {
      return res.status(400).json({ success: false, message: 'Invalid credentials or GST mismatch' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    user.otp = {
      code: otp,
      expiresAt: otpExpires,
    };
    await user.save();

    // Print to console for development verification
    console.log(`\n===================================`);
    console.log(`[OTP ALERT] User ID: ${userId} (${user.role})`);
    console.log(`Generated OTP: ${otp}`);
    console.log(`===================================\n`);

    // Send OTP via email
    await sendEmail({
      to: user.email,
      subject: 'NELMANI - Secure Login OTP',
      html: `<h3>Your NELMANI verification code:</h3>
             <h2>${otp}</h2>
             <p>This code is valid for 10 minutes. Please do not share it with anyone.</p>`,
    });

    res.json({
      success: true,
      message: 'OTP sent to your registered email address.',
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Verify OTP and return JWT session
// @route   POST /api/auth/verify-otp
// @access  Public
router.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ success: false, message: 'Please provide User ID and OTP code' });
  }

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    if (!user.otp || !user.otp.code || user.otp.code !== otp) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP code' });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP code has expired' });
    }

    // Clear OTP
    user.otp = undefined;
    await user.save();

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, userId: user.userId },
      process.env.JWT_SECRET || 'nelmani_secret_key_987654321_abc_xyz',
      { expiresIn: '7d' }
    );

    const company = await Company.findOne({ userId: user._id });

    // Set cookie option
    res.cookie('token', token, {
      httpOnly: true,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        userId: user.userId,
        email: user.email,
        role: user.role,
        companyName: company ? company.companyName : 'Admin',
      },
    });
  } catch (err) {
    console.error('OTP Verification error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get all pending registrations for Admin
// @route   GET /api/auth/pending-users
// @access  Private/Admin
router.get('/pending-users', protect, authorize('admin'), async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: 'pending' }).select('-password');
    const enrichedUsers = await Promise.all(
      pendingUsers.map(async (u) => {
        const company = await Company.findOne({ userId: u._id });
        return {
          _id: u._id,
          email: u.email,
          role: u.role,
          status: u.status,
          createdAt: u.createdAt,
          companyName: company ? company.companyName : '',
          gstNumber: company ? company.gstNumber : '',
          contactNumber: company ? company.contactNumber : '',
          address: company ? company.address : '',
        };
      })
    );
    res.json({ success: true, count: enrichedUsers.length, data: enrichedUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Admin login for convenience (bypass OTP in testing if needed, standard password verification)
// @route   POST /api/auth/admin-login
// @access  Public
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid admin credentials' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user._id, role: 'admin', userId: user.userId },
      process.env.JWT_SECRET || 'nelmani_secret_key_987654321_abc_xyz',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        userId: user.userId,
        email: user.email,
        role: 'admin',
        companyName: 'NELMANI Headquarters',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @desc    Get profile of currently logged-in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });
    res.json({
      success: true,
      data: {
        _id: req.user._id,
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        isApproved: req.user.isApproved,
        company: company || null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
