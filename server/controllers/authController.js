import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import { sendWelcomeEmail } from '../utils/emailService.js';
import crypto from 'crypto';
import Transaction from '../models/Transaction.js';

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const signupUser = async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ status: 'error', message: 'User already exists' });
    }

    let referrer = null;
    let initialCredits = 100;

    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      if (referrer) {
        initialCredits = 120;
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Generate unique code
    const userReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash,
      plan: 'free',
      credits: initialCredits,
      referralCode: userReferralCode,
      referredBy: referrer ? referrer._id : null
    });

    if (user) {
      // Transaction for new user
      await Transaction.create({
        userId: user._id,
        type: 'bonus',
        description: referrer ? 'Signup bonus with referral' : 'Signup bonus',
        credits: initialCredits,
        balanceAfter: initialCredits
      });

      // Reward referrer
      if (referrer) {
        referrer.credits += 100;
        await referrer.save();
        await Transaction.create({
          userId: referrer._id,
          type: 'referral',
          description: `Referral bonus for inviting ${user.name}`,
          credits: 100,
          balanceAfter: referrer.credits
        });
      }

      const token = generateToken(res, user._id);

      // Fire welcome email asynchronously
      sendWelcomeEmail(user.email, user.name).catch(err =>
        console.error('Welcome email failed:', err.message)
      );

      res.status(201).json({
        status: 'success',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
          credits: user.credits,
          avatar: user.avatar,
          referralCode: user.referralCode
        },
        token
      });
    } else {
      res.status(400).json({ status: 'error', message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ status: 'error', message: 'Server error during signup' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      
      if (user.isBanned) {
        return res.status(403).json({ status: 'error', message: 'Account is banned. Contact support.' });
      }

      // Auto-promote admin based on .env
      if (user.email === process.env.ADMIN_EMAIL && user.role !== 'admin') {
        user.role = 'admin';
        // Need to save before generating token so the user object returned has the right role
      }

      user.lastLoginAt = new Date();
      await user.save();

      const token = generateToken(res, user._id);

      res.status(200).json({
        status: 'success',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
          credits: user.credits,
          avatar: user.avatar,
          referralCode: user.referralCode
        },
        token
      });
    } else {
      res.status(401).json({ status: 'error', message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'Server error during login' });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    let user = await User.findById(req.user._id).select('-passwordHash');
    if (user) {
      // Auto-generate for legacy users missing a code
      if (!user.referralCode) {
        user.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
        await user.save();
      }
      res.status(200).json({
        status: 'success',
        user
      });
    } else {
      res.status(404).json({ status: 'error', message: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ status: 'error', message: 'Server error getting profile' });
  }
};
