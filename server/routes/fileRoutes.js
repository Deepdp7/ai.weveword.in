import express from 'express';
import { uploadFile, getMyFiles, deleteFile, getStorageInfo } from '../controllers/fileController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All file routes require authentication
router.use(protect);

// GET /api/files/storage — get user storage usage
router.get('/storage', getStorageInfo);

// GET /api/files/my-files — list all user files
router.get('/my-files', getMyFiles);

// POST /api/files/upload — upload a single file
router.post('/upload', upload.single('file'), uploadFile);

// DELETE /api/files/:id — soft-delete a file
router.delete('/:id', deleteFile);

export default router;
