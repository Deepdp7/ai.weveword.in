import express from 'express';
import multer from 'multer';
import { protect, checkCredits } from '../middleware/authMiddleware.js';
import * as animatorController from '../controllers/animatorController.js';
import path from 'path';

const router = express.Router();

// Multer storage for temp video files
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `temp_video_${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage });

router.post('/save', protect, checkCredits(15), upload.single('video'), animatorController.saveVideo);

export default router;
