import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  toggleBanUser,
  updateUserPlan,
  deleteUser,
  getAllTransactions,
  updateUserRole,
  getAdminTasks,
  updateUserCredits,
  getUserTransactions,
  getUserAIChats,
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
router.patch('/users/:id/credits', updateUserCredits);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/users/:id/transactions', getUserTransactions);
router.get('/users/:id/chats', getUserAIChats);

// Tasks (Admin task history)
router.get('/tasks', getAdminTasks);

// Transactions (platform-wide)
router.get('/transactions', getAllTransactions);

export default router;
