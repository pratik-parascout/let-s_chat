const path = require('path');
const Message = require('../models/chat');
const User = require('../models/user');
const Group = require('../models/group');
const GroupMember = require('../models/groupMember');
const { Op } = require('sequelize');

exports.getChat = (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/chat.html'));
};

exports.postMessage = async (req, res) => {
  try {
    const { content, groupId } = req.body;
    const userId = req.user.id;

    // Debug logs
    console.log('Received message:', content);
    console.log('Group ID:', groupId);

    // Fetch user details
    const user = await User.findByPk(userId, { attributes: ['username'] });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user is part of the group
    const membership = await GroupMember.findOne({
      where: { userId, groupId },
    });
    if (!membership) {
      return res.status(403).json({ error: 'User not in this group' });
    }

    // Create the message
    const message = await Message.create({
      content,
      userId,
      groupId,
      username: user.username,
    });

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
    // Assuming you have a method on the User instance to get groups
    const groups = await req.user.getGroups();
    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to load groups' });
  }
};

exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    // Create the group (assuming Group has a creatorId field)
    const group = await Group.create({
      name: name,
      creatorId: userId,
    });

    // Add the creator as a member with admin role
    await GroupMember.create({
      userId: userId,
      groupId: group.id,
      role: 'admin',
    });

    res.status(201).json({
      success: true,
      group: group,
    });
  } catch (error) {
    console.error('Group creation error:', error);
    res.status(500).json({ error: error.message });
  }
};
