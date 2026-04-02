/**
 * Notification Consumer
 * 
 * Logic to process notification events from the RabbitMQ queue.
 * - Saves notification to MongoDB.
 * - Broadcasts real-time alert via Socket.IO.
 */
import rabbitMQ from "../config/rabbitmq.js";
import NotificationService from "../services/notification.service.js";
import { getIO } from "../config/socket.js";
import logger from "../config/logger.js";
import { NOTIFICATION_QUEUE } from "./notification.producer.js";

/**
 * Start the notification consumer worker.
 * Connects to RabbitMQ and listens for incoming alerts.
 */
export const startNotificationConsumer = async () => {
  try {
    await rabbitMQ.consume(NOTIFICATION_QUEUE, async (data) => {
      logger.info(`Processing notification for user: ${data.recipient}`);

      // 1. Persist to MongoDB
      const notification = await NotificationService.createNotification(data);

      // 2. Broadcast via Socket.IO if recipient is online
      const io = getIO();
      if (io) {
        // Build the result object to emit (populated sender)
        const populatedNotification = await notification.populate("sender", "name avatar");
        
        io.to(`user:${data.recipient}`).emit("notification-alert", populatedNotification);
        
        // Also emit unread count update for UI badge
        const { unreadCount } = await NotificationService.getUnreadCount(data.recipient);
        io.to(`user:${data.recipient}`).emit("unread-count-update", { unreadCount });
        
        logger.debug(`Notification broadcasted via socket to user ${data.recipient}`);
      } else {
        logger.debug(`Socket.IO not initialized, skipping broadcast for user ${data.recipient}`);
      }
    });

    logger.info("Notification RabbitMQ Consumer initialized successfully");
  } catch (error) {
    logger.error(`Notification Consumer initialization failed: ${error.message}`);
  }
};

export default startNotificationConsumer;
