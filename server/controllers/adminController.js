import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Payment from '../models/Payment.js';
import FileModel from '../models/File.js';
import AdminTask from '../models/AdminTask.js';

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Admin only
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersThisMonth,
      newUsersThisWeek,
      capturedPayments,
      totalFiles,
      totalTransactions,
      totalToolUses,
      planBreakdown,
      recentUsers,
      recentPayments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Payment.find({ status: 'captured' }),
      FileModel.countDocuments({ isDeleted: false }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ type: 'tool_usage' }),

      // Group users by plan
      User.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Recent 5 registrations
      User.find().select('name email plan createdAt').sort({ createdAt: -1 }).limit(5),

      // Recent 5 payments
      Payment.find({ status: 'captured' })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Calculate revenue
    const totalRevenuePaise = capturedPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalRevenue = (totalRevenuePaise / 100).toFixed(2);
    const monthRevenuePaise = capturedPayments
      .filter(p => p.createdAt >= thirtyDaysAgo)
      .reduce((sum, p) => sum + p.amount, 0);
    const monthRevenue = (monthRevenuePaise / 100).toFixed(2);

    const weekRevenuePaise = capturedPayments
      .filter(p => p.createdAt >= sevenDaysAgo)
      .reduce((sum, p) => sum + p.amount, 0);
    const weeklyRevenue = (weekRevenuePaise / 100).toFixed(2);

    // Total credits sold
    const creditsSold = capturedPayments.reduce((sum, p) => sum + p.credits, 0);

    res.status(200).json({
      status: 'success',
      stats: {
        totalUsers,
        newUsersThisMonth,
        newUsersThisWeek,
        totalRevenue,
        monthRevenue,
        weeklyRevenue,
        creditsSold,
        totalFiles,
        totalTransactions,
        totalToolUses,
        planBreakdown,
        recentUsers,
        recentPayments,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ status: 'error', message: 'Could not fetch dashboard stats.' });
  }
};

// @desc    Get all users with pagination + search
// @route   GET /api/admin/users?page=1&limit=20&search=&plan=&role=
// @access  Admin only
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, plan, role, isBanned } = req.query;

    const query = {};
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (plan) query.plan = plan;
    if (role) query.role = role;
    if (isBanned !== undefined) query.isBanned = isBanned === 'true';

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      status: 'success',
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ status: 'error', message: 'Could not fetch users.' });
  }
};

// @desc    Ban or unban a user
// @route   PATCH /api/admin/users/:id/ban
// @access  Admin only
export const toggleBanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ status: 'error', message: 'Cannot ban an admin.' });

    user.isBanned = !user.isBanned;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: `User has been ${user.isBanned ? 'banned' : 'unbanned'}.`,
      isBanned: user.isBanned,
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ status: 'error', message: 'Could not update user ban status.' });
  }
};

// @desc    Update user plan (admin override)
// @route   PATCH /api/admin/users/:id/plan
// @access  Admin only
export const updateUserPlan = async (req, res) => {
  try {
    const { plan, creditsBonus } = req.body;
    const validPlans = ['free', 'basic', 'pro', 'elite'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ status: 'error', message: 'Invalid plan.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });

    user.plan = plan;
    if (creditsBonus && creditsBonus > 0) {
      user.credits += Number(creditsBonus);
    }
    if (plan !== 'free') {
      user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    await user.save();

    if (creditsBonus > 0) {
      await Transaction.create({
        userId: user._id,
        type: 'bonus',
        description: `Admin granted ${creditsBonus} bonus credits`,
        credits: Number(creditsBonus),
        balanceAfter: user.credits,
      });
    }

    // Log admin task
    await AdminTask.create({
      adminId: req.user._id,
      action: 'UPDATE_PLAN',
      targetUserId: user._id,
      details: `Updated plan to ${plan}${creditsBonus > 0 ? ` and granted ${creditsBonus} bonus credits` : ''}`
    });

    res.status(200).json({
      status: 'success',
      message: `User plan updated to "${plan}".`,
      user: { plan: user.plan, credits: user.credits },
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ status: 'error', message: 'Could not update user plan.' });
  }
};

// @desc    Hard delete a user account
// @route   DELETE /api/admin/users/:id
// @access  Admin only
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ status: 'error', message: 'Cannot delete an admin.' });

    // Soft-delete all user files
    await FileModel.updateMany({ userId: user._id }, { isDeleted: true });
    await User.deleteOne({ _id: user._id });

    res.status(200).json({ status: 'success', message: 'User account deleted.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ status: 'error', message: 'Could not delete user.' });
  }
};

// @desc    Get platform-wide transaction log
// @route   GET /api/admin/transactions
// @access  Admin only
export const getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;

    const [transactions, total] = await Promise.all([
      Transaction.find()
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(),
    ]);

    res.status(200).json({
      status: 'success',
      transactions,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ status: 'error', message: 'Could not fetch transactions.' });
  }
};

// @desc    Update user role (admin only)
// @route   PATCH /api/admin/users/:id/role
// @access  Admin only
export const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ status: 'error', message: 'Cannot modify your own role.' });
    }

    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();

    await AdminTask.create({
      adminId: req.user._id,
      action: user.role === 'admin' ? 'PROMOTED_ADMIN' : 'DEMOTED_ADMIN',
      targetUserId: user._id,
      details: `Changed role to ${user.role}`
    });

    res.status(200).json({
      status: 'success',
      message: `User role updated to ${user.role}.`,
      role: user.role,
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ status: 'error', message: 'Could not update user role.' });
  }
};

// @desc    Get admin task history
// @route   GET /api/admin/tasks
// @access  Admin only
export const getAdminTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [tasks, total] = await Promise.all([
      AdminTask.find()
        .populate('adminId', 'name email')
        .populate('targetUserId', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AdminTask.countDocuments(),
    ]);

    res.status(200).json({
      status: 'success',
      tasks,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ status: 'error', message: 'Could not fetch admin tasks.' });
  }
};
