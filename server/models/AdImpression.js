import mongoose from 'mongoose';

const adImpressionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    adType: {
      type: String,
      enum: ['15sec', '30sec'],
      required: true
    },
    creditsEarned: {
      type: Number,
      required: true
    },
    platform: {
      type: String,
      enum: ['web', 'android'],
      required: true
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

const AdImpression = mongoose.model('AdImpression', adImpressionSchema);

export default AdImpression;
