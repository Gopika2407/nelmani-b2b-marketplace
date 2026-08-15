const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    sparse: true, // Allows null/missing for pending users before approval
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true, // For fallback or admin credentials, though B2B flow uses OTP login
  },
  role: {
    type: String,
    enum: ['supplier', 'buyer', 'admin'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  otp: {
    code: String,
    expiresAt: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
