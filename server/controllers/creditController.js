import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

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

    if (cost === undefined) {
      return res.status(400).json({ status: 'error', message: `Unknown tool: ${toolKey}` });
    }

    const user = await User.findById(req.user._id);

    if (user.credits < cost) {
      return res.status(402).json({
        status: 'error',
        message: `Insufficient credits. You need ${cost} credits but have ${user.credits}.`,
        required: cost,
        current: user.credits,
      });
    }

    user.credits -= cost;
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: 'tool_usage',
      description: `Used tool: ${toolKey}`,
      credits: -cost,
      balanceAfter: user.credits,
    });

    res.status(200).json({
      status: 'success',
      creditsDeducted: cost,
      newBalance: user.credits,
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

    const rewards = { '15sec': 5, '30sec': 5 };
    const earned = rewards[adType];

    if (!earned) {
      return res.status(400).json({ status: 'error', message: 'Invalid ad type.' });
    }

    const user = await User.findById(req.user._id);
    user.credits += earned;
    await user.save();

    await Transaction.create({
      userId: user._id,
      type: 'ad_reward',
      description: `Watched ${adType} ad`,
      credits: earned,
      balanceAfter: user.credits,
    });

    res.status(200).json({
      status: 'success',
      creditsEarned: earned,
      newBalance: user.credits,
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
    const user = await User.findById(req.user._id).select('credits plan planExpiresAt');
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
