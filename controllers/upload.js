// controllers/upload.js
const multer = require('multer');
const multerS3 = require('multer-s3-v3');
const s3 = require('../utils/s3');
const path = require('path');

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'public-read', // Remove or modify if you use bucket policies instead
    key: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, `uploads/${Date.now().toString()}-${file.originalname}`);
    },
  }),
});

exports.uploadFile = upload.single('file'); // Field name: "file"
exports.uploadHandler = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ fileUrl: req.file.location });
};
