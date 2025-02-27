// src/routes.js
function registerRoutes(fastify, { rabbitMQ, config }) {
  fastify.post("/publish", async (request, reply) => {
    const { exchange, routingKey, message } = request.body;

    if (!exchange || !routingKey || !message) {
      return reply.code(400).send({
        success: false,
        error: "Missing required fields: exchange, routingKey, message",
      });
    }

    try {
      await rabbitMQ.publish(exchange, routingKey, message);
      return { success: true, message: "Message published successfully" };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to publish message",
      });
    }
  });

  fastify.post("/create-queue", async (request, reply) => {
    const { queueName, exchange, routingKey } = request.body;

    if (!queueName || !exchange || !routingKey) {
      return reply.code(400).send({
        success: false,
        error: "Missing required fields: queueName, exchange, routingKey",
      });
    }

    try {
      await rabbitMQ.createQueue(queueName, exchange, routingKey);
      return {
        success: true,
        message: `Queue ${queueName} created and bound to exchange ${exchange} with routing key ${routingKey}`,
      };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to create queue",
      });
    }
  });

  fastify.post("/test-message", async (request, reply) => {
    const { message } = request.body;

    if (!message) {
      return reply.code(400).send({
        success: false,
        error: "Missing required field: message",
      });
    }

    try {
      await rabbitMQ.publish(
        config.rabbitmq.exchanges.events.name,
        "test.event",
        {
          content: message,
          timestamp: new Date(),
          source: "fastify-microservice",
        }
      );
      return { success: true, message: "Test message sent" };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to send test message",
      });
    }
  });

  fastify.post("/command", async (request, reply) => {
    const { command, data } = request.body;

    if (!command) {
      return reply.code(400).send({
        success: false,
        error: "Missing required field: command",
      });
    }

    try {
      await rabbitMQ.publish(config.rabbitmq.exchanges.commands.name, command, {
        command,
        data,
        timestamp: new Date(),
        source: "fastify-microservice",
      });
      return { success: true, message: `Command ${command} sent` };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: "Failed to send command",
      });
    }
  });
}

module.exports = registerRoutes;
