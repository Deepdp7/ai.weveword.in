import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  content: {
    type: String, // Tiptap editor format or plain text for MVP
    default: ''
  }
});

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    template: {
      type: String,
      enum: ['btech', 'mba', 'school', 'internship', 'research'],
      default: 'school'
    },
    sections: [sectionSchema],
    lastExportedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

const Project = mongoose.model('Project', projectSchema);

export default Project;
