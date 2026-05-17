import express from 'express';
import * as scanController from '../controllers/scanController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/enhance', protect, scanController.enhanceDocument);

export default router;
