exports.promoteMember = async (req, res) => {
  const { groupId, userId } = req.params;
  // Only an admin should be allowed to do this. Check req.user's role.
  try {
    const membership = await GroupMember.findOne({
      where: { groupId, userId },
    });
    if (!membership) {
      return res.status(404).json({ error: 'Member not found in group' });
    }
    membership.role = 'admin';
    await membership.save();
    res.json({ message: 'Member promoted to admin' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to promote member' });
  }
};

// DELETE /groups/:groupId/members/:userId
exports.removeMember = async (req, res) => {
  const { groupId, userId } = req.params;
  try {
    const result = await GroupMember.destroy({ where: { groupId, userId } });
    if (result === 0) {
      return res.status(404).json({ error: 'Member not found in group' });
    }
    res.json({ message: 'Member removed from group' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
};
