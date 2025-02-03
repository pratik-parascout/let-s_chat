const express = require('express');

const router = express.Router();

const groupActionController = require('../controllers/groupAction.js');
const auth = require('../middleware/auth');

router.get(
  '/:groupId/members/:userId/promote',
  auth,
  groupActionController.promoteMember
);

router.post(
  '/:groupId/members/:userId',
  auth,
  groupActionController.removeMember
);

module.exports = router;
