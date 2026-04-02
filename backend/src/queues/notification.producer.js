/**
 * Notification Producer
 * 
 * Logic to publish notification events to the RabbitMQ queue.
 * Used by other services (Match, Chat, Review, Room) to trigger background processes.
 */
import rabbitMQ from "../config/rabbitmq.js";
import logger from "../config/logger.js";

const NOTIFICATION_QUEUE = "notifications";

class NotificationProducer {
  /**
   * Publish a notification to the queue.
   * 
   * @param {Object} data 
   * @param {String} data.recipient - Recipient user ID
   * @param {String} data.sender - [Optional] Sender user ID
   * @param {String} data.type - Notification type (from constants)
   * @param {String} data.title - Notification title
   * @param {String} data.message - Notification message
   * @param {String} data.refModel - [Optional] Mongoose model name
   * @param {String} data.refId - [Optional] ID of the referenced document
   * @param {Object} data.metadata - [Optional] Additional data
   */
  static async publishNotification(data) {
    try {
      await rabbitMQ.sendToQueue(NOTIFICATION_QUEUE, data);
      logger.info(`Notification event published to queue for user ${data.recipient}`);
    } catch (error) {
      logger.error(`Failed to publish notification event: ${error.message}`);
      // Fallback: If RabbitMQ is down, we could directly call the service,
      // but for "scalable" systems we want to rely on the queue.
      // throw error; 
    }
  }
}

export default NotificationProducer;
export { NOTIFICATION_QUEUE };
