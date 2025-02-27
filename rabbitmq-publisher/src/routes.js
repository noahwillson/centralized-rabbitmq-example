// src/routes.js
function registerRoutes(fastify, { publisher }) {
  // Health check endpoint
  fastify.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Generic publish endpoint
  fastify.post("/publish", async (request, reply) => {
    const { exchange, routingKey, message, options } = request.body;

    if (!exchange || !routingKey || !message) {
      return reply.code(400).send({
        success: false,
        error: "Missing required fields: exchange, routingKey, message",
      });
    }

    try {
      const result = await publisher.publishMessage(
        exchange,
        routingKey,
        message,
        options || {}
      );
      return { success: true, ...result };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to publish message",
        message: error.message,
      });
    }
  });

  // Event publishing endpoint
  fastify.post("/events", async (request, reply) => {
    const { type, data, options } = request.body;

    if (!type) {
      return reply.code(400).send({
        success: false,
        error: "Missing required field: type",
      });
    }

    try {
      const result = await publisher.publishEvent(
        type,
        data || {},
        options || {}
      );
      return { success: true, ...result };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to publish event",
        message: error.message,
      });
    }
  });

  // Command publishing endpoint
  fastify.post("/commands", async (request, reply) => {
    const { command, data, options } = request.body;

    if (!command) {
      return reply.code(400).send({
        success: false,
        error: "Missing required field: command",
      });
    }

    try {
      const result = await publisher.publishCommand(
        command,
        data || {},
        options || {}
      );
      return { success: true, ...result };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to send command",
        message: error.message,
      });
    }
  });

  // Notification publishing endpoint
  fastify.post("/notifications", async (request, reply) => {
    const { userId, notification, options } = request.body;

    if (!userId || !notification) {
      return reply.code(400).send({
        success: false,
        error: "Missing required fields: userId, notification",
      });
    }

    try {
      const result = await publisher.publishNotification(
        userId,
        notification,
        options || {}
      );
      return { success: true, ...result };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to send notification",
        message: error.message,
      });
    }
  });

  // Batch publishing endpoint
  fastify.post("/batch", async (request, reply) => {
    const { messages } = request.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return reply.code(400).send({
        success: false,
        error:
          "Missing or invalid required field: messages (must be a non-empty array)",
      });
    }

    try {
      const result = await publisher.publishBatch(messages);
      return result;
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to process batch",
        message: error.message,
      });
    }
  });
}

module.exports = registerRoutes;
