import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Map MIME types to Cloudinary resource types
const getResourceType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return 'raw'; // PDFs, DOCX, PPTX, etc.
};

// Map MIME types to our file type enum
export const getFileType = (mimetype) => {
  const map = {
    'application/pdf': 'pdf',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'video/mp4': 'mp4',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'image/svg+xml': 'svg',
  };
  return map[mimetype] || 'pdf';
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `kolomflow/${req.user._id}`,
    resource_type: getResourceType(file.mimetype),
    // Keep original filename (sanitized)
    public_id: `${Date.now()}_${file.originalname.replace(/\s+/g, '_').replace(/\.[^/.]+$/, '')}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'svg', 'gif', 'pdf', 'mp4', 'docx', 'pptx'],
  }),
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml',
    'application/pdf',
    'video/mp4',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
});

export default upload;
