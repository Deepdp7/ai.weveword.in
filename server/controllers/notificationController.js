import Notification from '../models/Notification.js';

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // Get the latest 50 notifications
    
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

    res.status(200).json({
      status: 'success',
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ status: 'error', message: 'Could not fetch notifications.' });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === 'all') {
      await Notification.updateMany(
        { userId: req.user._id, isRead: false },
        { $set: { isRead: true } }
      );
    } else {
      await Notification.findOneAndUpdate(
        { _id: id, userId: req.user._id },
        { $set: { isRead: true } }
      );
    }

    res.status(200).json({ status: 'success', message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ status: 'error', message: 'Could not mark as read.' });
  }
};
