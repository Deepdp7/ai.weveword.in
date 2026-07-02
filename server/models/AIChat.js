import mongoose from 'mongoose';

const aiChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentor: {
    type: String,
    required: true,
    enum: ['sahadev', 'krishna', 'vedbaash']
  },
  messages: [{
    role: {
      type: String,
      required: true,
      enum: ['user', 'assistant']
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Create a compound index so we can easily query a user's chat with a specific mentor
aiChatSchema.index({ user: 1, mentor: 1 }, { unique: true });

const AIChat = mongoose.model('AIChat', aiChatSchema);

export default AIChat;
