const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');
const User = require('./user');
const Group = require('./group');

const UserGroup = sequelize.define('UserGroup', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: User,
      key: 'id',
    },
  },
  groupId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Group,
      key: 'id',
    },
  },
});

module.exports = UserGroup;
