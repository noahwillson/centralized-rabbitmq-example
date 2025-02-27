require("dotenv").config();

module.exports = {
  rabbitmq: {
    uri: process.env.RABBITMQ_URI || "amqp://localhost:5672",
    exchanges: {
      events: {
        name: "events",
        type: "topic",
      },
      commands: {
        name: "commands",
        type: "direct",
      },
      notifications: {
        name: "notifications",
        type: "topic",
      },
      deadLetter: {
        name: "dead-letter",
        type: "fanout",
      },
    },
  },
  server: {
    port: process.env.PORT || 3002,
    host: process.env.HOST || "0.0.0.0",
  },
};
