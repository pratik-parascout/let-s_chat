const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload');
const auth = require('../middleware/auth');

router.post(
  '/',
  auth,
  uploadController.uploadFile,
  uploadController.uploadHandler
);

module.exports = router;
