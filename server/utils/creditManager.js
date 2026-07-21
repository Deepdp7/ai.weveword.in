import { prisma } from '../config/db.js';

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

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  if (user.credits < amount) {
    throw new Error('Insufficient credits');
  }

  // Deduct credits
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: amount } }
  });

  // Log transaction
  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: 'tool_usage',
      credits: -amount,
      balanceAfter: updatedUser.credits,
      description: description || `Used ${toolSource}`
    }
  });

  return updatedUser.credits;
};
