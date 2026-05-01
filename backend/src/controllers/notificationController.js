const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const recipient = req.user.role === 'admin' ? 'admin' : req.user.userId;
    const notifications = await Notification.find({ recipient })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.clearAll = async (req, res) => {
  try {
    const recipient = req.user.role === 'admin' ? 'admin' : req.user.userId;
    await Notification.deleteMany({ recipient });
    res.json({ message: 'Cleared all notifications' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
