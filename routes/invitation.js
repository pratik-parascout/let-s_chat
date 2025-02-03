const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/groupInvitation');
const auth = require('../middleware/auth');

router.get('/search', auth, invitationController.searchUsers);

router.post('/send', auth, invitationController.sendInvitation);

router.get('/', auth, invitationController.getInvitations);

router.post('/:id/accept', auth, invitationController.acceptInvitation);

router.post('/:id/reject', auth, invitationController.rejectInvitation);

module.exports = router;
