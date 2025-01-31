const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const GroupMember = sequelize.define(
  'GroupMember',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'member'),
      defaultValue: 'member',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['UserId', 'GroupId'], // Match association casing
      },
    ],
  }
);

module.exports = GroupMember;
