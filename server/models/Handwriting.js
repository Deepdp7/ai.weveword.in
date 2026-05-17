import mongoose from 'mongoose';

const handwritingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      default: 'My Script'
    },
    config: {
      fontSize: { type: Number, default: 24 },
      color: { type: String, default: '#000000' },
      letterSpacing: { type: Number, default: 1 },
      lineHeight: { type: Number, default: 1.5 },
      tilt: { type: Number, default: 0 },
      roughness: { type: Number, default: 1 },
      inkColor: { type: String, default: '#000000' },
      fontFamily: { type: String, default: 'cursive' }
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Handwriting = mongoose.model('Handwriting', handwritingSchema);

export default Handwriting;
