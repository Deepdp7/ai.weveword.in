import express from 'express';
import * as scanController from '../controllers/scanController.js';
import { protect, checkCredits } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/enhance', protect, checkCredits(5), scanController.enhanceDocument);

export default router;
