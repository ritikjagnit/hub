const prisma = require('../config/db');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.markRead = async (req, res) => {
  const { id } = req.params;
  try {
    const notification = await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { is_read: true }
    });
    res.json({ message: 'Notification marked as read', notification });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { user_id: req.user.id, is_read: false },
      data: { is_read: true }
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// Helper function to create in-app and trigger real-time notification
exports.sendNotification = async (io, userId, title, message, type = 'info') => {
  try {
    const notification = await prisma.notification.create({
      data: {
        user_id: parseInt(userId),
        title,
        message,
        type
      }
    });

    if (io) {
      // Emit to user's socket room
      io.to(`user_${userId}`).emit('receive_notification', notification);
    }
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};
