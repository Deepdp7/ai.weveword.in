import express from 'express';
import { signupUser, loginUser, logoutUser, getUserProfile } from '../controllers/authController.js';
import { sendForgotPasswordOTP, verifyOTPAndReset } from '../controllers/emailController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', sendForgotPasswordOTP);
router.post('/reset-password', verifyOTPAndReset);

// Protected routes
router.get('/profile', protect, getUserProfile);

export default router;
