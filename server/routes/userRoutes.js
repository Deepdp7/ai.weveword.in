import express from 'express';
import { updateProfile, updatePassword, getSettings } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All user routes are private
router.use(protect);

router.get('/settings', getSettings);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);

export default router;
