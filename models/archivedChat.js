// models/archivedChat.js
const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const ArchivedChat = sequelize.define(
  'ArchivedChat',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    freezeTableName: true, // Prevent automatic pluralization
  }
);

module.exports = ArchivedChat;
