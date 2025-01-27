const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET;

const auth = async (req, res, next) => {
  try {
    //console.log('Received headers:', req.headers); // Debug
    const token = req.header('Authorization')?.replace('Bearer ', '');
    //console.log('Extracted token:', token); // Debug

    if (!token) {
      console.error('No token provided');
      throw new Error();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret'
    );
    //console.log('Decoded token:', decoded); // Debug

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      console.error('User not found for ID:', decoded.userId);
      throw new Error();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error.message); // Debug
    res.status(401).json({ error: 'Please authenticate' });
  }
};

module.exports = auth;
