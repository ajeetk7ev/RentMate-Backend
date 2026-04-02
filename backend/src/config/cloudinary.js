/**
 * Cloudinary configuration for image uploads.
 */
import { v2 as cloudinary } from "cloudinary";
import env from "./env.js";
import logger from "./logger.js";

const connectCloudinary = () => {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

  logger.info("Cloudinary configured successfully.");
};

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {string} folder - Cloudinary folder name (e.g., "rentmate/profiles")
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadToCloudinary = (fileBuffer, folder = "rentmate") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

/**
 * Delete an image from Cloudinary by public_id.
 * @param {string} publicId - The public_id of the image
 * @returns {Promise<object>}
 */
const deleteFromCloudinary = async (publicId) => {
  return await cloudinary.uploader.destroy(publicId);
};

export { connectCloudinary, uploadToCloudinary, deleteFromCloudinary };
