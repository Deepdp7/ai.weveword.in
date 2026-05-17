import User from '../models/User.js';
import OTP from '../models/OTP.js';
import bcrypt from 'bcryptjs';
import { sendOTPEmail } from '../utils/emailService.js';

// Generate a secure 6-digit OTP
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// @desc    Send OTP to email for password reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Security: don't reveal if email exists — always return success
      return res.status(200).json({
        status: 'success',
        message: 'If that email is registered, an OTP will be sent.',
      });
    }

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase(), purpose: 'forgot_password' });

    // Generate + save new OTP (hashed for security)
    const code = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashedCode = await bcrypt.hash(code, salt);

    await OTP.create({
      email: email.toLowerCase(),
      code: hashedCode,
      purpose: 'forgot_password',
    });

    // Send the plain OTP via email
    await sendOTPEmail(email, code, 'forgot_password');

    res.status(200).json({
      status: 'success',
      message: 'OTP sent to your email. It expires in 10 minutes.',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ status: 'error', message: 'Could not send OTP.' });
  }
};

// @desc    Verify OTP and reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const verifyOTPAndReset = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ status: 'error', message: 'Email, OTP, and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters.' });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'forgot_password',
    });

    if (!otpRecord) {
      return res.status(400).json({ status: 'error', message: 'OTP expired or not found. Please request a new one.' });
    }

    // Limit brute-force attempts
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({ status: 'error', message: 'Too many attempts. Please request a new OTP.' });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, otpRecord.code);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        status: 'error',
        message: `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`,
      });
    }

    // OTP is valid — update password
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ status: 'error', message: 'Password reset failed.' });
  }
};
