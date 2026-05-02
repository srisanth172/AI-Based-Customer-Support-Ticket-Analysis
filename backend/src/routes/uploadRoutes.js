const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middleware/auth');

const { storage } = require('../config/cloudinary');

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 } 
}); // 5MB limit

router.post('/', authMiddleware, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }
  const imageUrl = req.file.path;
  res.status(200).json({ url: imageUrl, message: 'Image uploaded successfully' });
});

module.exports = router;
