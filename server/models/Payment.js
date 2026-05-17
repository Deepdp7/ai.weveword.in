import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['credit_pack', 'subscription'],
      required: true
    },
    amount: {
      type: Number, // in paise, e.g. 14900 = ₹149
      required: true
    },
    credits: {
      type: Number,
      required: true
    },
    planId: {
      type: String,
      default: null
    },
    razorpayOrderId: {
      type: String,
      required: true
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },
    razorpaySubscriptionId: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['created', 'captured', 'failed'],
      default: 'created'
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
