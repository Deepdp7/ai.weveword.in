import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

/**
 * Deducts credits from a user's account and logs the transaction.
 * @param {String} userId - The ID of the user.
 * @param {Number} amount - The number of credits to deduct.
 * @param {String} toolSource - The name of the tool being used (e.g., 'studio', 'ppt_maker').
 * @param {String} [description] - Optional description for the transaction log.
 * @returns {Number} - The remaining credit balance.
 */
export const deductCredits = async (userId, amount, toolSource, description) => {
  if (amount <= 0) return;

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (user.credits < amount) {
    throw new Error('Insufficient credits');
  }

  // Deduct credits
  user.credits -= amount;
  await user.save();

  // Log transaction
  await Transaction.create({
    userId: user._id,
    type: 'tool_usage',
    credits: -amount,
    amount: 0, 
    description: description || `Used ${toolSource}`,
    status: 'completed'
  });

  return user.credits;
};
