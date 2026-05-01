const LiveChat = require('../models/LiveChat');
const { emitTicketUpdated } = require('../services/socketService');

exports.getChat = async (req, res) => {
  try {
    let chat;
    if (req.user.role === 'customer') {
      chat = await LiveChat.findOne({ userId: req.user.userId, status: 'active' });
      if (!chat) {
        chat = new LiveChat({ userId: req.user.userId, messages: [] });
        await chat.save();
      }
    } else {
      chat = await LiveChat.findById(req.params.id).populate('userId', 'name email');
    }
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllChats = async (req, res) => {
  try {
    const chats = await LiveChat.find({ status: 'active' }).populate('userId', 'name email').sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const { message, sender } = req.body;
    let chat;
    
    if (req.user.role === 'customer') {
      chat = await LiveChat.findOne({ userId: req.user.userId, status: 'active' });
    } else {
      chat = await LiveChat.findById(req.params.id);
    }

    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    chat.messages.push({ sender, text: message, timestamp: new Date() });
    await chat.save();
    
    // Broadcast generic update so clients can refresh
    emitTicketUpdated({ _id: 'livechat' });
    
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
