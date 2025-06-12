const path = require("path");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");
const sharp = require("sharp");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to get file size
const getFileSize = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
};

// Helper function to compress images with improved logic
const compressImage = async (inputPath, outputPath, mimetype, originalSize) => {
  try {
    let sharpInstance = sharp(inputPath);

    // Get image metadata
    const metadata = await sharpInstance.metadata();
    const { width, height, format } = metadata;

    // Skip compression for very small images (< 50KB)
    if (originalSize < 50 * 1024) {
      return {
        success: false,
        reason: "File too small to benefit from compression",
      };
    }

    // Define compression settings based on file size and dimensions
    let quality = 85;
    let maxWidth = 1920;
    let maxHeight = 1080;
    let compressionLevel = 6;

    // Adjust settings based on original file size
    if (originalSize > 5 * 1024 * 1024) {
      // > 5MB
      quality = 70;
      maxWidth = 1600;
      maxHeight = 900;
      compressionLevel = 9;
    } else if (originalSize > 2 * 1024 * 1024) {
      // > 2MB
      quality = 75;
      maxWidth = 1800;
      maxHeight = 1000;
      compressionLevel = 8;
    } else if (originalSize > 1 * 1024 * 1024) {
      // > 1MB
      quality = 80;
      maxWidth = 1900;
      maxHeight = 1050;
      compressionLevel = 7;
    }

    // Apply resizing if image is too large
    if (width > maxWidth || height > maxHeight) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Apply format-specific compression
    switch (mimetype) {
      case "image/jpeg":
      case "image/jpg":
        await sharpInstance
          .jpeg({
            quality,
            progressive: true,
            mozjpeg: true,
            force: false,
          })
          .toFile(outputPath);
        break;

      case "image/png":
        await sharpInstance
          .png({
            quality,
            compressionLevel,
            palette: true,
            force: false,
          })
          .toFile(outputPath);
        break;

      case "image/webp":
        await sharpInstance
          .webp({
            quality,
            effort: 6,
            force: false,
          })
          .toFile(outputPath);
        break;

      case "image/gif":
        // For GIFs, only resize to preserve animation
        await sharpInstance.toFile(outputPath);
        break;

      default:
        // Convert other formats to JPEG
        await sharpInstance
          .jpeg({
            quality,
            progressive: true,
            force: true,
          })
          .toFile(outputPath);
        break;
    }

    // Verify the compressed file was created and get its size
    if (!fs.existsSync(outputPath)) {
      return {
        success: false,
        reason: "Compression failed - output file not created",
      };
    }

    const compressedSize = getFileSize(outputPath);
    if (compressedSize === 0) {
      return {
        success: false,
        reason: "Compression failed - output file is empty",
      };
    }

    // Calculate compression ratio
    const compressionRatio =
      ((originalSize - compressedSize) / originalSize) * 100;

    return {
      success: true,
      originalSize,
      compressedSize,
      compressionRatio: Math.round(compressionRatio * 100) / 100,
      savedBytes: originalSize - compressedSize,
    };
  } catch (error) {
    console.error("Image compression error:", error);
    return {
      success: false,
      reason: `Compression failed: ${error.message}`,
      error: error.message,
    };
  }
};

// Helper function to check if file is an image
const isImageFile = (mimetype) => {
  const imageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
  ];
  return mimetype && imageTypes.includes(mimetype.toLowerCase());
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp for better uniqueness
    const timestamp = Date.now();
    const uniqueSuffix = crypto.randomBytes(8).toString("hex");
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).substring(0, 50); // Limit name length
    cb(null, `${name}-${timestamp}-${uniqueSuffix}${ext}`);
  },
});

// Enhanced file filter with better validation
const fileFilter = (req, file, cb) => {
  // Allow common document and image types
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ];

  // Validate file type
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only images, PDFs, and documents are allowed.`,
      ),
      false,
    );
  }

  // Validate file name
  const filename = file.originalname;
  if (!filename || filename.length > 255) {
    return cb(
      new Error("Invalid filename. Must be between 1-255 characters."),
      false,
    );
  }

  // Check for potentially dangerous file extensions
  const dangerousExtensions = [
    ".exe",
    ".bat",
    ".cmd",
    ".com",
    ".pif",
    ".scr",
    ".vbs",
    ".js",
  ];
  const ext = path.extname(filename).toLowerCase();
  if (dangerousExtensions.includes(ext)) {
    return cb(new Error("File type not allowed for security reasons."), false);
  }

  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only allow 1 file per upload
  },
});

exports.uploadFile = async (req, res) => {
  try {
    console.log("Upload request received");
    console.log("Request headers:", req.headers);

    // Use multer middleware
    upload.single("file")(req, res, async (err) => {
      if (err) {
        console.error("Multer error:", err);
        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case "LIMIT_FILE_SIZE":
              return res.status(400).json({
                message: "File too large. Maximum size is 10MB.",
                error: "FILE_TOO_LARGE",
              });
            case "LIMIT_FILE_COUNT":
              return res.status(400).json({
                message: "Too many files. Only 1 file allowed per upload.",
                error: "TOO_MANY_FILES",
              });
            case "LIMIT_UNEXPECTED_FILE":
              return res.status(400).json({
                message: "Unexpected file field.",
                error: "UNEXPECTED_FILE",
              });
            default:
              return res.status(400).json({
                message: `Upload error: ${err.message}`,
                error: "UPLOAD_ERROR",
              });
          }
        }
        return res.status(400).json({
          message: err.message || "Upload failed",
          error: "UPLOAD_FAILED",
        });
      }

      if (!req.file) {
        console.log("No file received in request");
        return res.status(400).json({
          message: "No file uploaded",
          error: "NO_FILE",
        });
      }

      console.log("File received:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        filename: req.file.filename,
      });

      const originalSize = req.file.size;
      let finalFilePath = req.file.path;
      let finalFileSize = originalSize;
      let finalFilename = req.file.filename;
      let compressionStats = null;

      // Attempt compression for image files
      if (isImageFile(req.file.mimetype)) {
        try {
          // Generate compressed filename
          const ext = path.extname(req.file.filename);
          const nameWithoutExt = path.basename(req.file.filename, ext);
          const compressedFilename = `${nameWithoutExt}-compressed${ext}`;
          const compressedPath = path.join(uploadsDir, compressedFilename);

          // Compress the image
          const compressionResult = await compressImage(
            req.file.path,
            compressedPath,
            req.file.mimetype,
            originalSize,
          );

          if (compressionResult.success) {
            const compressedSize = compressionResult.compressedSize;

            // Only use compressed version if it's significantly smaller (at least 5% reduction)
            if (compressedSize < originalSize * 0.95) {
              // Delete original file
              fs.unlinkSync(req.file.path);

              // Update file info to point to compressed version
              finalFilePath = compressedPath;
              finalFileSize = compressedSize;
              finalFilename = compressedFilename;

              compressionStats = {
                compressed: true,
                originalSize,
                compressedSize,
                compressionRatio: compressionResult.compressionRatio,
                savedBytes: compressionResult.savedBytes,
              };
            } else {
              // Delete compressed file if it's not smaller
              fs.unlinkSync(compressedPath);
              compressionStats = {
                compressed: false,
                reason: "Compression did not reduce file size significantly",
                originalSize,
              };
            }
          } else {
            compressionStats = {
              compressed: false,
              reason: compressionResult.reason,
              originalSize,
            };
          }
        } catch (compressionError) {
          compressionStats = {
            compressed: false,
            reason: `Compression error: ${compressionError.message}`,
            originalSize,
          };
        }
      } else {
        compressionStats = {
          compressed: false,
          reason: "File type does not support compression",
          originalSize,
        };
      }

      // Return the file information with compression stats
      // Construct full URL for the uploaded file (without /api prefix)
      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
      const fileUrl = `${baseUrl}/uploads/${finalFilename}`;

      const response = {
        message: "File uploaded successfully",
        url: fileUrl,
        filename: finalFilename,
        originalName: req.file.originalname,
        size: finalFileSize,
        mimetype: req.file.mimetype,
        uploadedAt: new Date().toISOString(),
      };

      console.log("Upload successful:", {
        filename: finalFilename,
        url: fileUrl,
        size: finalFileSize,
      });

      res.status(200).json(response);
    });
  } catch (error) {
    console.error("Upload controller error:", error);
    res.status(500).json({
      message: "Internal server error during upload",
      error: "INTERNAL_ERROR",
    });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;

    // Enhanced filename validation
    if (
      !filename ||
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\") ||
      filename.length > 255 ||
      filename.startsWith(".")
    ) {
      return res.status(400).json({
        message: "Invalid filename",
        error: "INVALID_FILENAME",
      });
    }

    const filePath = path.join(uploadsDir, filename);

    // Ensure the file path is within the uploads directory (security check)
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      return res.status(400).json({
        message: "Invalid file path",
        error: "INVALID_PATH",
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "File not found",
        error: "FILE_NOT_FOUND",
      });
    }

    // Get file stats before deletion
    const stats = fs.statSync(filePath);

    // Delete the file
    fs.unlinkSync(filePath);

    console.log(`File deleted successfully: ${filename} (${stats.size} bytes)`);

    res.status(200).json({
      message: "File deleted successfully",
      filename,
      deletedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({
      message: "Failed to delete file",
      error: "DELETE_FAILED",
    });
  }
};
