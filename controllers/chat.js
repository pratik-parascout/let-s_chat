const path = require('path');
const Message = require('../models/chat');
const User = require('../models/user');

exports.getChat = (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/chat.html'));
};

exports.postMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId, { attributes: ['username'] });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create a new message with content, userId, and username
    const message = await Message.create({
      content,
      // userId,
      username: user.username,
    });

    res.status(201).json({
      id: message.id,
      content: message.content,
      username: message.username,
      createdAt: message.createdAt,
    });
  } catch (error) {
    console.error('Store message error:', error);
    res.status(500).json({ error: 'Failed to store message' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.findAll({
      order: [['createdAt', 'ASC']],
      limit: 50,
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};
