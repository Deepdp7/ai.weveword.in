import express from 'express';
import { handleChat, getHistory, clearHistory } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/chat', handleChat);
router.get('/history/:mentor', getHistory);
router.delete('/history/:mentor', clearHistory);

export default router;
