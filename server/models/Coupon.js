import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    type: {
      type: String,
      enum: ['fixed_credits', 'percentage_bonus', 'free_plan'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    maxUses: {
      type: Number,
      required: true,
      default: 1
    },
    usedCount: {
      type: Number,
      default: 0
    },
    perUserLimit: {
      type: Number,
      default: 1
    },
    expiresAt: {
      type: Date,
      required: true
    },
    createdBy: {
      type: String, // admin email
      required: true
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
