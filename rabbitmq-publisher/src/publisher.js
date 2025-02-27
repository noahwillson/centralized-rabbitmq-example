function createPublisher(rabbitMQ, config) {
  // Publish a generic message to any exchange and routing key
  async function publishMessage(exchange, routingKey, message, options = {}) {
    try {
      await rabbitMQ.publish(exchange, routingKey, message, options);
      return {
        success: true,
        exchange,
        routingKey,
        messageId: options.messageId || generateId(),
      };
    } catch (error) {
      console.error(
        `Failed to publish message to ${exchange}:${routingKey}`,
        error
      );
      throw error;
    }
  }

  // Publish an event to the events exchange
  async function publishEvent(eventType, data, options = {}) {
    const messageId = options.messageId || generateId();
    const message = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      id: messageId,
    };

    return publishMessage(
      config.rabbitmq.exchanges.events.name,
      eventType,
      message,
      { ...options, messageId }
    );
  }

  // Publish a command to the commands exchange
  async function publishCommand(commandName, data, options = {}) {
    const messageId = options.messageId || generateId();
    const message = {
      command: commandName,
      data,
      timestamp: new Date().toISOString(),
      id: messageId,
    };

    return publishMessage(
      config.rabbitmq.exchanges.commands.name,
      commandName,
      message,
      { ...options, messageId }
    );
  }

  // Publish a notification
  async function publishNotification(userId, notification, options = {}) {
    const messageId = options.messageId || generateId();
    const message = {
      userId,
      notification,
      timestamp: new Date().toISOString(),
      id: messageId,
    };

    return publishMessage(
      config.rabbitmq.exchanges.notifications.name,
      `user.${userId}`,
      message,
      { ...options, messageId }
    );
  }

  // Publish a batch of messages
  async function publishBatch(messages) {
    const results = [];
    const errors = [];

    for (const msg of messages) {
      try {
        let result;

        if (msg.type === "event") {
          result = await publishEvent(msg.eventType, msg.data, msg.options);
        } else if (msg.type === "command") {
          result = await publishCommand(msg.commandName, msg.data, msg.options);
        } else if (msg.type === "notification") {
          result = await publishNotification(
            msg.userId,
            msg.notification,
            msg.options
          );
        } else {
          result = await publishMessage(
            msg.exchange,
            msg.routingKey,
            msg.message,
            msg.options
          );
        }

        results.push(result);
      } catch (error) {
        errors.push({
          message: msg,
          error: error.message,
        });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      total: messages.length,
      successful: results.length,
      failed: errors.length,
    };
  }

  // Helper function to generate a unique ID
  function generateId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  return {
    publishMessage,
    publishEvent,
    publishCommand,
    publishNotification,
    publishBatch,
  };
}

module.exports = createPublisher;
