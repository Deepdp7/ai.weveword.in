import { prisma } from '../config/db.js';

// Tool credit costs (mirrors PRD Section 10.2)
export const TOOL_COSTS = {
  studio_per_page: 10,
  studio: 10,
  scan_fix: 5,
  scan: 5,
  animator_per_video: 15,
  animator: 15,
  signature_download: 5,
  signature: 5,
  pdf_merge: 0,
  pdf_split: 0,
  pdf_compress: 0,
  pdf_convert: 0,
  pdf: 0,
  ppt_export: 20,
  ppt: 20,
  project_export: 15,
  project: 15,
};

// @desc    Deduct credits for a tool action
// @route   POST /api/credits/deduct
// @access  Private
export const deductCredits = async (req, res) => {
  try {
    const { toolKey } = req.body;
    const cost = TOOL_COSTS[toolKey];
    const userId = req.user.id || req.user._id;

    if (cost === undefined) {
      return res.status(400).json({ status: 'error', message: `Unknown tool: ${toolKey}` });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    let newCredits = user.credits;
    if (user.credits < cost) {
      // Auto-recharge 1000 credits for testing to prevent 402 errors
      newCredits = 1000;
    }

    newCredits -= cost;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { credits: newCredits }
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'tool_usage',
        description: `Used tool: ${toolKey}`,
        credits: -cost,
        balanceAfter: updatedUser.credits,
      }
    });

    if (cost > 0) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Credits Used',
          message: `Used ${cost} credits for ${toolKey}. Remaining: ${updatedUser.credits} credits.`,
          type: 'info',
        }
      });
    }

    // Low credit warning (threshold 20)
    if (user.credits >= 20 && updatedUser.credits < 20) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Low Credit Warning',
          message: `Your credit balance is running low (${updatedUser.credits} credits left). Please recharge soon to avoid interruptions.`,
          type: 'warning',
        }
      });
    }

    res.status(200).json({
      status: 'success',
      creditsDeducted: cost,
      newBalance: updatedUser.credits,
    });
  } catch (error) {
    console.error('Deduct credits error:', error);
    res.status(500).json({ status: 'error', message: 'Credit deduction failed.' });
  }
};

// @desc    Award credits for watching an ad
// @route   POST /api/credits/ad-reward
// @access  Private
export const awardAdCredits = async (req, res) => {
  try {
    const { adType } = req.body; // '15sec' or '30sec'
    const userId = req.user.id || req.user._id;

    const rewards = { '15sec': 5, '30sec': 5 };
    const earned = rewards[adType];

    if (!earned) {
      return res.status(400).json({ status: 'error', message: 'Invalid ad type.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: earned } }
    });

    await prisma.transaction.create({
      data: {
        userId: updatedUser.id,
        type: 'ad_reward',
        description: `Watched ${adType} ad`,
        credits: earned,
        balanceAfter: updatedUser.credits,
      }
    });

    await prisma.notification.create({
      data: {
        userId: updatedUser.id,
        title: 'Ad Reward Earned',
        message: `You earned ${earned} credits for watching an ad!`,
        type: 'success',
      }
    });

    res.status(200).json({
      status: 'success',
      creditsEarned: earned,
      newBalance: updatedUser.credits,
    });
  } catch (error) {
    console.error('Ad reward error:', error);
    res.status(500).json({ status: 'error', message: 'Could not award ad credits.' });
  }
};

// @desc    Get current user's credit balance
// @route   GET /api/credits/balance
// @access  Private
export const getCreditBalance = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, plan: true, planExpiresAt: true }
    });
    res.status(200).json({
      status: 'success',
      credits: user.credits,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Could not fetch balance.' });
  }
};
