import express from 'express';
import * as studioController from '../controllers/studioController.js';
import { protect, checkCredits } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.use(protect);

router.get('/projects', studioController.getProjects);
router.post('/save', studioController.saveProject);
router.post('/export/:projectId', studioController.exportProject);
router.post('/extract-text', checkCredits(10), upload.single('file'), studioController.extractText);
router.post('/render', studioController.renderHandwriting);
router.post('/export-pdf', checkCredits(10), studioController.exportPdf);

export default router;
