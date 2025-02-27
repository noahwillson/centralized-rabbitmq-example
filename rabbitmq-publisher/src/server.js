const fastify = require("fastify")({
  logger: {
    level: process.env.LOG_LEVEL || "info",
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          headers: request.headers,
          hostname: request.hostname,
          remoteAddress: request.ip,
          remotePort: request.socket.remotePort,
        };
      },
    },
  },
});
const config = require("./config");
const createRabbitMQClient = require("./rabbitmq-client");
const createPublisher = require("./publisher");
const registerRoutes = require("./routes");

// Create RabbitMQ client
const rabbitMQ = createRabbitMQClient(config.rabbitmq);

// Create publisher
const publisher = createPublisher(rabbitMQ, config);

// Register CORS
fastify.register(require("@fastify/cors"), {
  origin: "*",
  methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// Register routes
registerRoutes(fastify, { publisher });

// Start the server
const start = async () => {
  try {
    // Connect to RabbitMQ
    await rabbitMQ.connect();

    // Start the server
    await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });

    console.log(`Publisher service is running on port ${config.server.port}`);
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

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Attempt graceful shutdown
  shutdown().catch((err) => {
    console.error("Error during shutdown after uncaught exception:", err);
    process.exit(1);
  });
});

start();
