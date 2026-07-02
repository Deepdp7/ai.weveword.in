import Razorpay from 'razorpay';
import { createHmac } from 'crypto';
import Payment from '../models/Payment.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

let razorpayInstance = null;
const getRazorpay = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

// Credit Pack configuration (mirrors PRD Section 11)
export const CREDIT_PACKS = {
  mini: { credits: 25, amount: 1000, label: 'Mini Pack' },             // ₹10
  starter: { credits: 100, amount: 4900, label: 'Starter Pack' },       // ₹49
  popular: { credits: 250, amount: 9900, label: 'Popular Pack' },      // ₹99
  pro: { credits: 450, amount: 19900, label: 'Pro Pack' },             // ₹199
};

// Subscription Plan configuration (mirrors PRD Section 9)
export const PLAN_PACKS = {
  pro: { credits: 2000, amount: 49900, label: 'Pro Plan', plan: 'pro' }, // ₹499/mo
};

// @desc    Create Razorpay order for credit pack
// @route   POST /api/payments/create-order
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { packId, type } = req.body; // type: 'credits' or 'plan'

    const packs = type === 'plan' ? PLAN_PACKS : CREDIT_PACKS;
    const pack = packs[packId];

    if (!pack) {
      return res.status(400).json({ status: 'error', message: 'Invalid pack selected.' });
    }

    const options = {
      amount: pack.amount, // amount in paise
      currency: 'INR',
      receipt: `rcpt_${req.user._id.toString().slice(-6)}_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        packId,
        type,
        credits: pack.credits,
      },
    };

    const order = await getRazorpay().orders.create(options);

    // Save pending payment record
    await Payment.create({
      userId: req.user._id,
      type: type === 'plan' ? 'subscription' : 'credit_pack',
      amount: pack.amount,
      credits: pack.credits,
      planId: type === 'plan' ? pack.plan : null,
      razorpayOrderId: order.id,
      status: 'created',
    });

    res.status(201).json({
      status: 'success',
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        pack,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ status: 'error', message: 'Could not create payment order.' });
  }
};

// @desc    Verify Razorpay payment signature & credit user
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ status: 'error', message: 'Missing required payment fields.' });
    }

    // Verify signature using HMAC SHA256
    const expectedSignature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ status: 'error', message: 'Payment verification failed. Invalid signature.' });
    }

    // Find matching payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment record not found.' });
    }

    // Mark payment captured
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.status = 'captured';
    await payment.save();

    // Credit user's account
    const user = await User.findById(payment.userId);
    const balanceBefore = user.credits;
    user.credits += payment.credits;

    // If subscription, update plan & expiry (30 days from now)
    if (payment.type === 'subscription' && payment.planId) {
      user.plan = payment.planId;
      user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    await user.save();

    // Log transaction in credit ledger
    await Transaction.create({
      userId: user._id,
      type: payment.type === 'subscription' ? 'subscription' : 'purchase',
      description: `Purchased ${payment.credits} credits`,
      credits: payment.credits,
      balanceAfter: user.credits,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    // Create Notification
    await Notification.create({
      userId: user._id,
      title: 'Payment Successful',
      message: `Your payment for ${payment.credits} credits was successful! New balance is ${user.credits} credits.`,
      type: 'success',
    });

    res.status(200).json({
      status: 'success',
      message: `Payment verified! ${payment.credits} credits added.`,
      newBalance: user.credits,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ status: 'error', message: 'Payment verification error.' });
  }
};

// @desc    Get user transaction history
// @route   GET /api/payments/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      status: 'success',
      transactions,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ status: 'error', message: 'Could not fetch transaction history.' });
  }
};
