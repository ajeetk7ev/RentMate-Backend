/**
 * Winston Logger Configuration
 *
 * Centralized logging with structured output.
 * - Development: colorized, readable console output
 * - Production: JSON-formatted file + console output
 */
import { createLogger, format, transports } from "winston";
import env from "./env.js";

const { combine, timestamp, printf, colorize, errors, json } = format;

// Custom format for development — clean, readable
const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logger instance
const logger = createLogger({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true })
  ),
  defaultMeta: { service: "rentmate-api" },
  transports: [],
});

// Development — colorized console
if (env.NODE_ENV === "development") {
  logger.add(
    new transports.Console({
      format: combine(colorize(), devFormat),
    })
  );
} else {
  // Production — JSON console
  logger.add(
    new transports.Console({
      format: combine(json()),
    })
  );

  // Production — error log file
  logger.add(
    new transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    })
  );

  // Production — combined log file
  logger.add(
    new transports.File({
      filename: "logs/combined.log",
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    })
  );
}

export default logger;
