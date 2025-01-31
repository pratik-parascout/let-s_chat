const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat');
const auth = require('../middleware/auth'); // Middleware for authentication

router.get('/', chatController.getChat);

router.post('/messages', auth, chatController.postMessage);

router.get('/messages', auth, chatController.getMessages);

router.get('/groups', auth, chatController.getGroups);

router.post('/groups', auth, chatController.createGroup);

module.exports = router;
