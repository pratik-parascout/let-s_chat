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

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const message = await Message.create({
      content: content.trim(),
      userId,
    });

    const messageWithUser = await Message.findByPk(message.id, {
      include: [{ model: User, attributes: ['username'] }],
    });

    res.status(201).json({
      message: 'Message sent',
      content: messageWithUser.content,
      username: messageWithUser.User.username,
    });
  } catch (error) {
    console.error('Message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.findAll({
      include: [{ model: User, attributes: ['username'] }],
      order: [['createdAt', 'ASC']],
    });

    // Log the messages to check if User is being included
    console.log(messages);

    const formatted = messages.map((m) => ({
      content: m.content,
      username: m.username, // Check if User is defined
      createdAt: m.createdAt,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ error: 'Failed to load messages' });
  }
};
