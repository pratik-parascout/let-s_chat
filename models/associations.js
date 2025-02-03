const User = require('./user');
const Group = require('./group');
const Message = require('./chat');
const GroupMember = require('./groupMember');
const GroupInvitation = require('./groupInvitation');

// Message Associations
Message.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
Message.belongsTo(Group, { foreignKey: 'groupId', onDelete: 'CASCADE' });

// User - Group Relationships (Many-to-Many via GroupMember)
User.belongsToMany(Group, {
  through: GroupMember,
  foreignKey: 'userId',
  otherKey: 'groupId',
  onDelete: 'CASCADE',
});
Group.belongsToMany(User, {
  through: GroupMember,
  foreignKey: 'groupId',
  otherKey: 'userId',
  onDelete: 'CASCADE',
});

// GroupInvitation Associations
GroupInvitation.belongsTo(User, {
  foreignKey: 'invitedUserId',
  onDelete: 'CASCADE',
});
GroupInvitation.belongsTo(User, {
  as: 'Inviter',
  foreignKey: 'invitedBy',
  onDelete: 'CASCADE',
});
GroupInvitation.belongsTo(Group, {
  foreignKey: 'groupId',
  onDelete: 'CASCADE',
});

module.exports = { User, Group, Message, GroupMember, GroupInvitation };
