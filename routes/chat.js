const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat');
const auth = require('../middleware/auth'); // Assuming the 'auth' middleware is used to authenticate users

router.get('/', chatController.getChat);

// Post a new chat message
router.post('/', auth, chatController.postMessage);

// Get all chat messages
router.get('/messages', auth, chatController.getMessages);

module.exports = router;
