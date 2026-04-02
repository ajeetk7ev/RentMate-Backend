/**
 * Centralized Environment Configuration
 *
 * All environment variables are accessed through this single file.
 * This ensures validation at startup and prevents scattered process.env calls.
 */
import dotenv from "dotenv";
dotenv.config();

const env = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/rentmate",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "default_jwt_secret_change_me",
  JWT_EXPIRE: process.env.JWT_EXPIRE || "7d",
  JWT_COOKIE_EXPIRE: parseInt(process.env.JWT_COOKIE_EXPIRE) || 7,

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Redis
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",

  // RabbitMQ
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost:5672",
};

// Validate Critical Variables
const requiredVars = ["MONGODB_URI", "JWT_SECRET"];

const missing = requiredVars.filter((key) => !env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

export default env;
