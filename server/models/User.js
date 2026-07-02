import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    avatar: {
      type: String, // Cloudinary URL
      default: ''
    },
    bio: {
      type: String,
      maxLength: 160,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'elite'],
      default: 'free'
    },
    planExpiresAt: {
      type: Date,
      default: null
    },
    credits: {
      type: Number,
      default: 0
    },
    aiDailyUsage: {
      sahadev: { type: Number, default: 0 },
      krishna: { type: Number, default: 0 },
      vedbaash: { type: Number, default: 0 },
      lastResetAt: { type: Date, default: Date.now }
    },
    storageUsed: {
      type: Number, // in bytes
      default: 0
    },
    savedSignatures: [{
      type: String // Cloudinary URLs
    }],
    isBanned: {
      type: Boolean,
      default: false
    },
    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

const User = mongoose.model('User', userSchema);

export default User;
