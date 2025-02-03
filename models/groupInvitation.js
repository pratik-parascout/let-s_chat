const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');
const User = require('./user');
const Group = require('./group');

const GroupInvitation = sequelize.define(
  'GroupInvitation',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // The ID of the user being invited
    invitedUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    // The ID of the group to which the invitation applies
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Group,
        key: 'id',
      },
    },
    // The ID of the admin (or inviter)
    invitedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    // Invitation status: pending, accepted, or rejected
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      defaultValue: 'pending',
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);

module.exports = GroupInvitation;
