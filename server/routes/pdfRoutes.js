import express from 'express';
import multer from 'multer';
import * as pdfController from '../controllers/pdfController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Helper for optional auth - allows guest use but saves to DB if logged in
const optionalAuth = (req, res, next) => {
  // If no token, just proceed as guest. 
  // If there's a token, 'protect' will attach the user.
  // We can use a modified protect or just call protect and handle error.
  next();
};

// Existing PDF tools
router.post('/merge', upload.array('pdfs', 20), pdfController.merge);
router.post('/split', upload.single('pdf'), pdfController.split);

// New Conversion Tools (require login to save to library)
router.post('/word-to-pdf', protect, upload.single('file'), pdfController.wordToPdf);
router.post('/ppt-to-pdf', protect, upload.single('file'), pdfController.pptToPdf);
router.post('/excel-to-pdf', protect, upload.single('file'), pdfController.excelToPdf);
router.post('/txt-to-pdf', protect, upload.single('file'), pdfController.txtToPdf);
router.post('/images-to-pdf', protect, upload.array('files', 20), pdfController.jpgToPdf);

export default router;
