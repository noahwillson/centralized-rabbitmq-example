const amqp = require("amqp-connection-manager");
const EventEmitter = require("events");

function createRabbitMQClient(config) {
  const eventEmitter = new EventEmitter();
  let connection = null;
  let channelWrapper = null;
  let isConnected = false;

  async function connect() {
    try {
      connection = amqp.connect([config.uri], {
        heartbeatIntervalInSeconds: 5,
        reconnectTimeInSeconds: 5,
      });

      connection.on("connect", () => {
        console.log("Connected to RabbitMQ");
        isConnected = true;
        eventEmitter.emit("connected");
      });

      connection.on("disconnect", (err) => {
        console.error("Disconnected from RabbitMQ", err);
        isConnected = false;
        eventEmitter.emit("disconnected", err);
      });

      channelWrapper = connection.createChannel({
        setup: async (channel) => {
          // Setup exchanges
          for (const exchange of Object.values(config.exchanges)) {
            await channel.assertExchange(exchange.name, exchange.type, {
              durable: true,
            });
            console.log(`Exchange ${exchange.name} asserted`);
          }
        },
      });

      await channelWrapper.waitForConnect();
      console.log("RabbitMQ channel established");
      return true;
    } catch (error) {
      console.error("Failed to initialize RabbitMQ connection", error);
      throw error;
    }
  }

  async function close() {
    if (channelWrapper) await channelWrapper.close();
    if (connection) await connection.close();
    console.log("RabbitMQ connection closed");
  }

  async function publish(exchange, routingKey, message, options = {}) {
    try {
      if (!isConnected) {
        throw new Error("Not connected to RabbitMQ");
      }

      const buffer = Buffer.from(JSON.stringify(message));
      await channelWrapper.publish(exchange, routingKey, buffer, {
        persistent: true,
        ...options,
      });
      console.log(
        `Message published to exchange ${exchange} with routing key ${routingKey}`
      );
      return true;
    } catch (error) {
      console.error(
        `Error publishing message to exchange ${exchange} with routing key ${routingKey}`,
        error
      );
      throw error;
    }
  }

  return {
    connect,
    close,
    publish,
    on: (event, listener) => eventEmitter.on(event, listener),
    off: (event, listener) => eventEmitter.off(event, listener),
    isConnected: () => isConnected,
  };
}

module.exports = createRabbitMQClient;
