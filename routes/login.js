const express = require('express');

const router = express.Router();

const loginController = require('../controllers/login.js');

router.get('/', loginController.getPage);

router.post('/', loginController.postLogin);

module.exports = router;
