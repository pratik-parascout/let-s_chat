const express = require('express');
const router = express.Router();
const path = require('path');

const signupController = require('../controllers/signup');

router.get('/', signupController.getSignup);

// Your other routes for handling POST requests etc.
router.post('/', (req, res) => {
  // Handle signup form submission
});

module.exports = router;
