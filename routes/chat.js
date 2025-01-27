const express = require('express');

const router = express.Router();

const chatController = require('../controllers/chat.js');

router.get('/', chatController.getPage);

// router.post('/', loginController.postLogin);

module.exports = router;
