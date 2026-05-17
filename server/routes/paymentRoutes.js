import express from 'express';
import { createOrder, verifyPayment, getTransactions, CREDIT_PACKS, PLAN_PACKS } from '../controllers/paymentController.js';
import { deductCredits, awardAdCredits, getCreditBalance } from '../controllers/creditController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require auth
router.use(protect);

// ─── Payment Routes ───────────────────────────────────────────────────────────
// GET /api/payments/packs — list available packs (for the shop UI)
router.get('/packs', (req, res) => {
  res.json({
    status: 'success',
    creditPacks: Object.entries(CREDIT_PACKS).map(([id, p]) => ({ id, ...p })),
    planPacks: Object.entries(PLAN_PACKS).map(([id, p]) => ({ id, ...p })),
  });
});

// POST /api/payments/create-order
router.post('/create-order', createOrder);

// POST /api/payments/verify
router.post('/verify', verifyPayment);

// GET /api/payments/transactions
router.get('/transactions', getTransactions);

// ─── Credit Routes ────────────────────────────────────────────────────────────
// GET /api/payments/credits/balance
router.get('/credits/balance', getCreditBalance);

// POST /api/payments/credits/deduct
router.post('/credits/deduct', deductCredits);

// POST /api/payments/credits/ad-reward
router.post('/credits/ad-reward', awardAdCredits);

export default router;
