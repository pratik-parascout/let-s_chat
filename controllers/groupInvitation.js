const { Op } = require('sequelize');
const User = require('../models/user');
const GroupInvitation = require('../models/groupInvitation');
const GroupMember = require('../models/groupMember');

// Search users by username, email, or phone
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { username: { [Op.like]: `%${q}%` } },
          { email: { [Op.like]: `%${q}%` } },
          { phone: { [Op.like]: `%${q}%` } },
        ],
      },
      attributes: ['id', 'username', 'email', 'phone'],
    });
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

// Send an invitation for a user to join a group
exports.sendInvitation = async (req, res) => {
  try {
    const { groupId, invitedUserId } = req.body;
    const invitedBy = req.user.id;

    // Check if an invitation already exists and is pending
    const existing = await GroupInvitation.findOne({
      where: { groupId, invitedUserId, status: 'pending' },
    });
    if (existing) {
      return res.status(400).json({ error: 'Invitation already sent' });
    }

    const invitation = await GroupInvitation.create({
      groupId,
      invitedUserId,
      invitedBy,
      status: 'pending',
    });

    res.status(201).json({ message: 'Invitation sent', invitation });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
};

// Get pending invitations for the user
exports.getInvitations = async (req, res) => {
  try {
    const userId = req.user.id;
    const invitations = await GroupInvitation.findAll({
      where: { invitedUserId: userId, status: 'pending' },
      include: [
        { model: require('../models/group'), attributes: ['id', 'name'] },
        {
          model: require('../models/user'),
          as: 'Inviter',
          attributes: ['id', 'username'],
        },
      ],
    });
    res.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
};

// Accept an invitation
exports.acceptInvitation = async (req, res) => {
  try {
    const invitationId = req.params.id;
    const invitation = await GroupInvitation.findByPk(invitationId);
    if (!invitation || invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invalid invitation' });
    }
    invitation.status = 'accepted';
    await invitation.save();
    // Add the user to the group via GroupMember
    await GroupMember.create({
      userId: invitation.invitedUserId,
      groupId: invitation.groupId,
      role: 'member',
    });
    res.json({ message: 'Invitation accepted', invitation });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
};

// Reject an invitation
exports.rejectInvitation = async (req, res) => {
  try {
    const invitationId = req.params.id;
    const invitation = await GroupInvitation.findByPk(invitationId);
    if (!invitation || invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invalid invitation' });
    }
    invitation.status = 'rejected';
    await invitation.save();
    res.json({ message: 'Invitation rejected', invitation });
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    res.status(500).json({ error: 'Failed to reject invitation' });
  }
};
