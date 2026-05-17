import express from 'express';
import { getPresets, createPreset, updatePreset, deletePreset } from '../controllers/labController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/presets', getPresets);
router.post('/presets', createPreset);
router.put('/presets/:id', updatePreset);
router.delete('/presets/:id', deletePreset);

export default router;
