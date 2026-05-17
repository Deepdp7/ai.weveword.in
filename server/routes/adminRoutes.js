import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  toggleBanUser,
  updateUserPlan,
  deleteUser,
  getAllTransactions,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes — must be logged in AND have role === 'admin'
router.use(protect, adminOnly);

// Dashboard
router.get('/stats', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.patch('/users/:id/ban', toggleBanUser);
router.patch('/users/:id/plan', updateUserPlan);
router.delete('/users/:id', deleteUser);

// Transactions (platform-wide)
router.get('/transactions', getAllTransactions);

export default router;
