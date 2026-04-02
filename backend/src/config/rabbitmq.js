/**
 * RabbitMQ Connection Utility
 * 
 * Manages the connection and channel for RabbitMQ.
 * Centralizes publishing and consuming logic.
 */
import amqp from "amqplib";
import env from "./env.js";
import logger from "./logger.js";

class RabbitMQ {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnecting = false;
  }

  /**
   * Connect to RabbitMQ.
   */
  async connect() {
    if (this.connection) return;
    if (this.isConnecting) return;

    this.isConnecting = true;
    try {
      this.connection = await amqp.connect(env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      logger.info("RabbitMQ connected successfully");

      this.connection.on("error", (err) => {
        logger.error(`RabbitMQ connection error: ${err.message}`);
        this.connection = null;
        this.channel = null;
      });

      this.connection.on("close", () => {
        logger.warn("RabbitMQ connection closed. Reconnecting...");
        this.connection = null;
        this.channel = null;
        setTimeout(() => this.connect(), 5000);
      });

      this.isConnecting = false;
    } catch (error) {
      logger.error(`RabbitMQ connection failed: ${error.message}`);
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Get the current channel.
   */
  async getChannel() {
    if (!this.channel) {
      await this.connect();
    }
    return this.channel;
  }

  /**
   * Assert a queue.
   */
  async assertQueue(queue) {
    const channel = await this.getChannel();
    await channel.assertQueue(queue, { durable: true });
  }

  /**
   * Send a message to a queue.
   */
  async sendToQueue(queue, message) {
    const channel = await this.getChannel();
    await this.assertQueue(queue);
    
    const buffer = Buffer.from(JSON.stringify(message));
    channel.sendToQueue(queue, buffer, { persistent: true });
    
    logger.debug(`Message sent to queue: ${queue}`);
  }

  /**
   * Start consuming from a queue.
   */
  async consume(queue, onMessage) {
    const channel = await this.getChannel();
    await this.assertQueue(queue);

    // Limit the number of unacknowledged messages
    await channel.prefetch(1);

    channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        await onMessage(content);
        channel.ack(msg);
      } catch (error) {
        logger.error(`Error consuming message from ${queue}: ${error.message}`);
        // reject and requeue
        channel.nack(msg, false, true);
      }
    });

    logger.info(`Started consuming from queue: ${queue}`);
  }

  /**
   * Graceful shutdown.
   */
  async close() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      logger.info("RabbitMQ connection closed gracefully");
    } catch (error) {
      logger.error(`Error closing RabbitMQ connection: ${error.message}`);
    }
  }
}

export const rabbitMQ = new RabbitMQ();
export default rabbitMQ;
