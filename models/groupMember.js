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
      allowNull: false,
      defaultValue: 'member',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'groupId'],
      },
    ],
  }
);

module.exports = GroupMember;
