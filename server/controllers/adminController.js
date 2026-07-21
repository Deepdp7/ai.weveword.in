import { prisma } from '../config/db.js';

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
      planGroup,
      recentUsers,
      recentPayments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.payment.findMany({ where: { status: 'captured' } }),
      prisma.file.count(),
      prisma.transaction.count(),
      prisma.transaction.count({ where: { type: 'tool_usage' } }),

      // Group users by plan
      prisma.user.groupBy({
        by: ['plan'],
        _count: { plan: true },
        orderBy: { _count: { plan: 'desc' } }
      }),

      // Recent 5 registrations
      prisma.user.findMany({
        select: { id: true, name: true, email: true, plan: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),

      // Recent 5 payments
      prisma.payment.findMany({
        where: { status: 'captured' },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    const planBreakdown = planGroup.map(g => ({ _id: g.plan, count: g._count.plan }));

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

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (plan) where.plan = plan;
    if (role) where.role = role;
    if (isBanned !== undefined) where.isBanned = isBanned === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);
    
    const safeUsers = users.map(({ passwordHash, ...user }) => user);

    res.status(200).json({
      status: 'success',
      users: safeUsers,
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
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ status: 'error', message: 'Cannot ban an admin.' });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isBanned: !user.isBanned }
    });

    res.status(200).json({
      status: 'success',
      message: `User has been ${updatedUser.isBanned ? 'banned' : 'unbanned'}.`,
      isBanned: updatedUser.isBanned,
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

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });

    let updateData = { plan };
    const bonus = Number(creditsBonus) || 0;
    
    if (bonus > 0) {
      updateData.credits = { increment: bonus };
    }
    if (plan !== 'free') {
      updateData.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    if (bonus > 0) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'bonus',
          description: `Admin granted ${bonus} bonus credits`,
          credits: bonus,
          balanceAfter: updatedUser.credits,
        }
      });
    }

    const adminId = req.user.id || req.user._id;
    // Log admin task
    await prisma.adminTask.create({
      data: {
        adminId: adminId,
        action: 'UPDATE_PLAN',
        targetUserId: user.id,
        details: `Updated plan to ${plan}${bonus > 0 ? ` and granted ${bonus} bonus credits` : ''}`
      }
    });

    res.status(200).json({
      status: 'success',
      message: `User plan updated to "${plan}".`,
      user: { plan: updatedUser.plan, credits: updatedUser.credits },
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ status: 'error', message: 'Could not update user plan.' });
  }
};

// @desc    Update user credits (admin override)
// @route   PATCH /api/admin/users/:id/credits
// @access  Admin only
export const updateUserCredits = async (req, res) => {
  try {
    const { action, amount, reason } = req.body;
    const inputAmount = Number(amount);
    
    if (isNaN(inputAmount)) {
      return res.status(400).json({ status: 'error', message: 'Valid amount is required.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });

    let creditDelta = 0;
    if (action === 'set') {
      if (inputAmount < 0) return res.status(400).json({ status: 'error', message: 'Balance cannot be negative.' });
      creditDelta = inputAmount - user.credits;
    } else {
      if (inputAmount === 0) return res.status(400).json({ status: 'error', message: 'Valid non-zero amount is required.' });
      creditDelta = inputAmount;
    }

    // Prevent negative balance
    if (user.credits + creditDelta < 0) {
      return res.status(400).json({ status: 'error', message: `Cannot deduct ${Math.abs(creditDelta)}. User only has ${user.credits} credits.` });
    }

    if (creditDelta === 0) {
      return res.status(200).json({ status: 'success', message: 'No changes made.', credits: user.credits });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { credits: { increment: creditDelta } }
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: creditDelta > 0 ? 'bonus' : 'adjustment',
        description: `Admin adjustment: ${reason || 'Manual modification'}`,
        credits: creditDelta,
        balanceAfter: updatedUser.credits,
      }
    });

    const adminId = req.user.id || req.user._id;
    await prisma.adminTask.create({
      data: {
        adminId: adminId,
        action: 'UPDATE_CREDITS',
        targetUserId: user.id,
        details: `${creditDelta > 0 ? 'Added' : 'Deducted'} ${Math.abs(creditDelta)} credits. Reason: ${reason || 'None'}`
      }
    });

    res.status(200).json({
      status: 'success',
      message: `Successfully ${creditDelta > 0 ? 'added' : 'deducted'} ${Math.abs(creditDelta)} credits.`,
      credits: updatedUser.credits,
    });
  } catch (error) {
    console.error('Update credits error:', error);
    res.status(500).json({ status: 'error', message: 'Could not update user credits.' });
  }
};

// @desc    Hard delete a user account
// @route   DELETE /api/admin/users/:id
// @access  Admin only
export const deleteUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ status: 'error', message: 'Cannot delete an admin.' });

    await prisma.file.deleteMany({ where: { userId: user.id } });
    
    // We also need to delete relationships or add ON DELETE CASCADE to schema.
    // For safety, let's delete relationships manually if Prisma complains, 
    // but schema has some cascading needed. Let's just delete the user, 
    // Prisma will throw an error if we have referential integrity without cascade.
    // Assuming we have cascading set up or manual deletion is enough:
    await prisma.aIChat.deleteMany({ where: { userId: user.id } });
    await prisma.adImpression.deleteMany({ where: { userId: user.id } });
    await prisma.adminTask.deleteMany({ where: { targetUserId: user.id } });
    await prisma.handwriting.deleteMany({ where: { userId: user.id } });
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.payment.deleteMany({ where: { userId: user.id } });
    await prisma.project.deleteMany({ where: { userId: user.id } });
    await prisma.transaction.deleteMany({ where: { userId: user.id } });

    await prisma.user.delete({ where: { id: user.id } });

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
      prisma.transaction.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.transaction.count()
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
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found.' });
    const adminId = req.user.id || req.user._id;
    
    if (user.id === adminId) {
      return res.status(400).json({ status: 'error', message: 'Cannot modify your own role.' });
    }

    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: newRole }
    });

    await prisma.adminTask.create({
      data: {
        adminId: adminId,
        action: newRole === 'admin' ? 'PROMOTED_ADMIN' : 'DEMOTED_ADMIN',
        targetUserId: user.id,
        details: `Changed role to ${newRole}`
      }
    });

    res.status(200).json({
      status: 'success',
      message: `User role updated to ${newRole}.`,
      role: newRole,
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
      prisma.adminTask.findMany({
        include: { 
          admin: { select: { name: true, email: true } },
          targetUser: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.adminTask.count()
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

// @desc    Get user's transactions
// @route   GET /api/admin/users/:id/transactions
// @access  Admin only
export const getUserTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ status: 'success', transactions });
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ status: 'error', message: 'Could not fetch user transactions.' });
  }
};

// @desc    Get user's AI Mentor chats
// @route   GET /api/admin/users/:id/chats
// @access  Admin only
export const getUserAIChats = async (req, res) => {
  try {
    let chats = await prisma.aIChat.findMany({
      where: { userId: req.params.id },
      orderBy: { updatedAt: 'desc' }
    });
    
    // Parse stringified messages to array for backward compatibility
    chats = chats.map(chat => ({
      ...chat,
      messages: JSON.parse(chat.messages)
    }));

    res.status(200).json({ status: 'success', chats });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({ status: 'error', message: 'Could not fetch user chats.' });
  }
};
