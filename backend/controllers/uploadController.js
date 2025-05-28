const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');
const sharp = require('sharp');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to compress images
const compressImage = async (inputPath, outputPath, mimetype) => {
  try {
    let sharpInstance = sharp(inputPath);
    
    // Get image metadata for size checking
    const metadata = await sharpInstance.metadata();
    
    // Define compression settings based on image type and size
    let quality = 85; // Default quality
    let maxWidth = 1920; // Default max width
    let maxHeight = 1080; // Default max height
    
    // Adjust compression based on file size
    if (metadata.size && metadata.size > 2 * 1024 * 1024) { // > 2MB
      quality = 75;
      maxWidth = 1600;
      maxHeight = 900;
    } else if (metadata.size && metadata.size > 1 * 1024 * 1024) { // > 1MB
      quality = 80;
      maxWidth = 1800;
      maxHeight = 1000;
    }
    
    // Resize if image is too large
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Apply format-specific compression
    if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
      await sharpInstance
        .jpeg({ quality, progressive: true, mozjpeg: true })
        .toFile(outputPath);
    } else if (mimetype === 'image/png') {
      await sharpInstance
        .png({ quality, compressionLevel: 9, palette: true })
        .toFile(outputPath);
    } else if (mimetype === 'image/gif') {
      // For GIFs, just resize without quality compression to preserve animation
      await sharpInstance.toFile(outputPath);
    } else {
      // For other image types, convert to JPEG
      await sharpInstance
        .jpeg({ quality, progressive: true })
        .toFile(outputPath);
    }
    
    return true;
  } catch (error) {
    console.error('Image compression error:', error);
    return false;
  }
};

// Helper function to check if file is an image
const isImageFile = (mimetype) => {
  return mimetype && mimetype.startsWith('image/');
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow common document and image types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

exports.uploadFile = async (req, res) => {
  try {
    // Use multer middleware
    upload.single('file')(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
          }
        }
        return res.status(400).json({ message: err.message || 'Upload failed' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      let finalFilePath = req.file.path;
      let finalFileSize = req.file.size;
      let isCompressed = false;

      // Compress image files
      if (isImageFile(req.file.mimetype)) {
        try {
          // Generate compressed filename
          const ext = path.extname(req.file.filename);
          const nameWithoutExt = path.basename(req.file.filename, ext);
          const compressedFilename = `${nameWithoutExt}-compressed${ext}`;
          const compressedPath = path.join(uploadsDir, compressedFilename);
          
          // Compress the image
          const compressionSuccess = await compressImage(req.file.path, compressedPath, req.file.mimetype);
          
          if (compressionSuccess && fs.existsSync(compressedPath)) {
            // Get compressed file size
            const compressedStats = fs.statSync(compressedPath);
            
            // Only use compressed version if it's actually smaller
            if (compressedStats.size < req.file.size) {
              // Delete original file
              fs.unlinkSync(req.file.path);
              
              // Update file info to point to compressed version
              finalFilePath = compressedPath;
              finalFileSize = compressedStats.size;
              req.file.filename = compressedFilename;
              isCompressed = true;
            } else {
              // Delete compressed file if it's not smaller
              fs.unlinkSync(compressedPath);
            }
          }
        } catch (compressionError) {
          console.error('Compression failed, using original file:', compressionError);
          // Continue with original file if compression fails
        }
      }

      // Return the file URL
      const fileUrl = `/uploads/${req.file.filename}`;
      
      res.status(200).json({
        message: 'File uploaded successfully',
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: finalFileSize,
        mimetype: req.file.mimetype,
        compressed: isCompressed
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Internal server error during upload' });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename (security check)
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ message: 'Invalid filename' });
    }
    
    const filePath = path.join(uploadsDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Delete the file
    fs.unlinkSync(filePath);
    
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
};