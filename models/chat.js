const { DataTypes } = require('sequelize');
const sequelize = require('../utils/database');

const Message = sequelize.define('Message', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  username: {
    // New username field
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Message;
