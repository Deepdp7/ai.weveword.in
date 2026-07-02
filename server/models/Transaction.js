import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['purchase', 'ad_reward', 'tool_usage', 'subscription', 'refund', 'bonus', 'coupon', 'referral'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    credits: {
      type: Number, // positive = earned, negative = spent
      required: true
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    razorpayOrderId: {
      type: String,
      default: null
    },
    razorpayPaymentId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
