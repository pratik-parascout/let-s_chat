const path = require('path');

exports.getSignup = (req, res) => {
  res.sendFile(path.join(__dirname, '../public/html/signup.html'));
};
