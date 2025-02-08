const path = require('path');
const { Op } = require('sequelize');
const Message = require('../models/chat');
const User = require('../models/user');
const Group = require('../models/group');
const GroupMember = require('../models/groupMember');

exports.getChat = (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/chat.html'));
};

exports.postMessage = async (req, res) => {
  try {
    const { content, groupId } = req.body;
    const userId = req.user.id;

    console.log('Received message:', content);
    console.log('Group ID:', groupId);

    const user = await User.findByPk(userId, { attributes: ['username'] });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const membership = await GroupMember.findOne({
      where: { userId, groupId },
    });
    if (!membership) {
      return res.status(403).json({ error: 'User not in this group' });
    }

    const message = await Message.create({
      content,
      userId,
      groupId,
      username: user.username,
    });

    const io = req.app.get('io');
    io.to(`group_${groupId}`).emit('newMessage', message);

    console.log('Message created:', message);
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
    const { groupId, lastMessageId } = req.query;
    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required' });
    }
    const lastId = parseInt(lastMessageId) || 0;
    const messages = await Message.findAll({
      where: {
        groupId,
        id: { [Op.gt]: lastId },
      },
      order: [['id', 'ASC']],
    });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const groups = await req.user.getGroups();
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to load groups' });
  }
};

exports.createGroup = async (req, res) => {
  const sequelize = require('../utils/database');
  const t = await sequelize.transaction();
  try {
    const { name } = req.body;
    const userId = req.user.id;
    const group = await Group.create(
      {
        name: name,
        creatorId: userId,
      },
      { transaction: t }
    );
    await GroupMember.create(
      {
        userId: userId,
        groupId: group.id,
        role: 'admin',
      },
      { transaction: t }
    );
    await t.commit();
    res.status(201).json({ success: true, group });
  } catch (error) {
    await t.rollback();
    console.error('Group creation error:', error);
    res.status(500).json({ error: error.message });
  }
};
