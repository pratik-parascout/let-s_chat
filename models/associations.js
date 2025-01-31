const User = require('./user');
const Group = require('./group');
const Message = require('./chat');
const GroupMember = require('./groupMember'); // Assuming this is the join table

// Message Associations
Message.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
Message.belongsTo(Group, { foreignKey: 'groupId', onDelete: 'CASCADE' });

// User - Group Relationships (Many-to-Many through GroupMember)
User.belongsToMany(Group, {
  through: GroupMember, // GroupMember handles the join
  foreignKey: 'userId', // This will be the foreign key in the join table
  otherKey: 'groupId', // The other key pointing to Group
  onDelete: 'CASCADE', // Ensures cascading delete
});

Group.belongsToMany(User, {
  through: GroupMember, // GroupMember handles the join
  foreignKey: 'groupId', // This will be the foreign key in the join table
  otherKey: 'userId', // The other key pointing to User
  onDelete: 'CASCADE', // Ensures cascading delete
});

module.exports = { User, Group, Message, GroupMember };
