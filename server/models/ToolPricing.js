import mongoose from 'mongoose';

const toolPricingSchema = new mongoose.Schema(
  {
    toolKey: {
      type: String,
      required: true,
      unique: true,
      index: true
      // Example: 'studio_per_page', 'animator_per_minute', 'signature_download'
    },
    credits: {
      type: Number,
      required: true,
      min: 0
    },
    updatedBy: {
      type: String, // admin email
      required: true
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

const ToolPricing = mongoose.model('ToolPricing', toolPricingSchema);

export default ToolPricing;
