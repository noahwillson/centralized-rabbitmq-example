export const rabbitmqConfig = {
  exchanges: {
    events: {
      name: 'events',
      type: 'topic',
    },
    commands: {
      name: 'commands',
      type: 'direct',
    },
  },
  uri: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
};
