const path = require('path');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const sequelize = require('../utils/database');
const jwt = require('jsonwebtoken');

exports.getPage = (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/login.html'));
};

exports.postLogin = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ msg: 'Please provide both email and password' });
    }

    const user = await User.findOne({
      where: { email },
      transaction: t,
    });

    if (!user) {
      await t.rollback();
      return res.status(404).json({ msg: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await t.rollback();
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await User.update(
      { lastLogin: new Date() },
      {
        where: { id: user.id },
        transaction: t,
      }
    );

    await t.commit();

    // Send success response with token
    res.status(200).json({
      msg: 'Login successful',
      token,
      userId: user.id,
    });
  } catch (err) {
    await t.rollback();
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Internal server error' });
  }
};
