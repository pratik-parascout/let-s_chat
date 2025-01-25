const path = require('path');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const sequelize = require('../utils/database');

exports.getSignup = (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/signup.html'));
};

exports.postSignup = async (req, res) => {
  const { username, email, phone, password } = req.body;
  const t = await sequelize.transaction();

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create a new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create(
      { username, email, phone, password: hashedPassword },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    await t.rollback();

    if (err.name === 'SequelizeValidationError') {
      res.status(400).json({ error: err.message });
    } else if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ error: 'User already exists, Please Login' });
    } else {
      console.error(err);
      res.status(500).json({ error: 'An error occurred during signup' });
    }
  }
};
