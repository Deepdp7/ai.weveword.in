import { prisma } from '../config/db.js';
import bcrypt from 'bcryptjs';

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    let user = await prisma.user.findUnique({ where: { id: userId } });

    if (user) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: req.body.name || user.name,
          avatar: req.body.avatar || user.avatar
        }
      });

      res.status(200).json({
        status: 'success',
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          plan: updatedUser.plan,
          credits: updatedUser.credits,
          avatar: updatedUser.avatar,
        },
      });
    } else {
      res.status(404).json({ status: 'error', message: 'User not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ status: 'error', message: 'Server error updating profile' });
  }
};

// @desc    Update user password
// @route   PUT /api/users/password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id || req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ status: 'error', message: 'Current and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user && (await bcrypt.compare(currentPassword, user.passwordHash))) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);
      
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      });

      res.status(200).json({ status: 'success', message: 'Password updated successfully' });
    } else {
      res.status(401).json({ status: 'error', message: 'Invalid current password' });
    }
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ status: 'error', message: 'Server error updating password' });
  }
};

// @desc    Get user preferences/settings
// @route   GET /api/users/settings
// @access  Private
export const getSettings = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, credits: true, storageUsed: true }
    });
    
    if (user) {
      res.status(200).json({
        status: 'success',
        settings: {
          plan: user.plan,
          credits: user.credits,
          storageUsed: user.storageUsed,
        },
      });
    } else {
      res.status(404).json({ status: 'error', message: 'User not found' });
    }
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ status: 'error', message: 'Server error getting settings' });
  }
};
