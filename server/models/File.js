import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    toolSource: {
      type: String,
      enum: ['studio', 'scan', 'animator', 'pdf', 'ppt', 'project', 'signature'],
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String, // Cloudinary URL
      required: true
    },
    fileType: {
      type: String,
      enum: ['pdf', 'png', 'jpg', 'mp4', 'docx', 'pptx', 'svg'],
      required: true
    },
    size: {
      type: Number, // bytes
      required: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

const FileModel = mongoose.model('File', fileSchema);

export default FileModel;
