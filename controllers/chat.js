const path = require('path');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const sequelize = require('../utils/database');
const jwt = require('jsonwebtoken');

exports.getPage = (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/chat.html'));
};
