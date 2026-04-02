/**
 * Multer configuration for file uploads.
 * Uses memory storage (buffer) for Cloudinary uploads.
 */
import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

// Use memory storage — files are held in buffer, not saved to disk
const storage = multer.memoryStorage();

// File filter — only allow images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only JPEG, PNG, and WebP images are allowed."), false);
  }
};

// Single image upload (e.g., profile avatar)
const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("image");

// Multiple images upload (e.g., room photos — max 10)
const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
}).array("images", 10);

export { uploadSingle, uploadMultiple };
