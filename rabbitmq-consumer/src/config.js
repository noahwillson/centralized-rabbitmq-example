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
    },
  },
  server: {
    port: process.env.PORT || 3001,
  },
};
