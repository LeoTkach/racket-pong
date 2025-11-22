const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Ensure uploads directories exist
const baseUploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../../../frontend/public/uploads');
const tournamentsUploadsDir = path.join(baseUploadsDir, 'tournaments');
const avatarsUploadsDir = path.join(baseUploadsDir, 'avatars');
if (!fs.existsSync(tournamentsUploadsDir)) {
  fs.mkdirSync(tournamentsUploadsDir, { recursive: true });
}
if (!fs.existsSync(avatarsUploadsDir)) {
  fs.mkdirSync(avatarsUploadsDir, { recursive: true });
}

// Configure multer for tournament images
const tournamentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tournamentsUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `tournament-${uniqueSuffix}-${name}${ext}`);
  }
});

// Configure multer for avatar images
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarsUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `avatar-${uniqueSuffix}-${name}${ext}`);
  }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const tournamentUpload = multer({
  storage: tournamentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for avatars
  },
  fileFilter: fileFilter
});

// Upload tournament image endpoint
router.post('/tournament-image', (req, res, next) => {
  tournamentUpload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      console.error('Error type:', err.constructor.name);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ error: err.message || 'File upload error' });
      }
      
      // Handle file filter errors and other errors
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    
    try {
      if (!req.file) {
        console.error('No file uploaded - req.file is:', req.file);
        console.error('Request body:', req.body);
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Return the URL path to the uploaded file
      const fileUrl = `/uploads/tournaments/${req.file.filename}`;
      console.log('File uploaded successfully:', fileUrl);
      res.json({
        message: 'Image uploaded successfully',
        imageUrl: fileUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Error processing upload:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: 'Failed to process uploaded image', details: error.message });
    }
  });
});

// Upload user avatar endpoint
router.post('/user-avatar', (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: err.message || 'File upload error' });
      }
      
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileUrl = `/uploads/avatars/${req.file.filename}`;
      console.log('Avatar uploaded successfully:', fileUrl);
      res.json({
        message: 'Avatar uploaded successfully',
        imageUrl: fileUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Error processing upload:', error);
      res.status(500).json({ error: 'Failed to process uploaded image', details: error.message });
    }
  });
});

// Delete tournament image endpoint
router.delete('/tournament-image/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(tournamentsUploadsDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Image deleted successfully' });
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Delete user avatar endpoint
router.delete('/user-avatar/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(avatarsUploadsDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Avatar deleted successfully' });
    } else {
      res.status(404).json({ error: 'Avatar not found' });
    }
  } catch (error) {
    console.error('Error deleting avatar:', error);
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
});

module.exports = router;

