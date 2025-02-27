// src/server.js
const fastify = require("fastify")({ logger: true });
const config = require("./config");
const createRabbitMQClient = require("./rabbitmq-client");
const createMessageHandlers = require("./message-handlers");
const registerRoutes = require("./routes");

// Create RabbitMQ client
const rabbitMQ = createRabbitMQClient(config.rabbitmq);

// Create message handlers
const messageHandlers = createMessageHandlers();

// Register routes
registerRoutes(fastify, { rabbitMQ, config });

// Setup consumers
async function setupConsumers() {
  // Setup consumer for test events
  await rabbitMQ.createQueue(
    "fastify-test-events-queue",
    config.rabbitmq.exchanges.events.name,
    "test.event"
  );

  await rabbitMQ.consume("fastify-test-events-queue", async (message) => {
    console.log("Received test event:", message);
    return messageHandlers.handleTestEvent(message);
  });

  // Setup consumer for commands
  await rabbitMQ.createQueue(
    "fastify-commands-queue",
    config.rabbitmq.exchanges.commands.name,
    "process.data" // Example command routing key
  );

  await rabbitMQ.consume("fastify-commands-queue", async (message) => {
    console.log("Received command:", message);
    return messageHandlers.handleCommand(message);
  });

  await rabbitMQ.createQueue(
    "order-processing-queue",
    config.rabbitmq.exchanges.commands.name,
    "process.order"
  );

  await rabbitMQ.consume("order-processing-queue", async (message) => {
    console.log("Received order processing command:", message);
    return messageHandlers.handleOrderProcessing(message);
  });

  await rabbitMQ.consume("user-events-queue", async (message, channel) => {
    console.log("Received user event:", message);
    try {
      if (message.content) {
        const content = JSON.parse(message.content.toString());
        console.log("Processing user event:", content);
      } else {
        console.log("Received message with no content");
      }
      // Acknowledge the message
      channel.ack(message);
    } catch (error) {
      console.error("Error processing message:", error);
      channel.nack(message, false, false);
    }
  });

  console.log("Order processing consumer set up successfully");

  console.log("Consumers set up successfully");
}

// Start the server
const start = async () => {
  try {
    // Connect to RabbitMQ
    await rabbitMQ.connect();

    // Setup consumers
    await setupConsumers();

    // Start the server
    await fastify.listen({ port: config.server.port, host: "0.0.0.0" });
    console.log(`Server is running on port ${config.server.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
const shutdown = async () => {
  console.log("Shutting down...");
  await rabbitMQ.close();
  await fastify.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
