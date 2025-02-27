# Centralized RabbitMQ Microservices Architecture

---

## Features

### Centralized RabbitMQ Service (NestJS)
- **Publish Messages**: Accepts POST requests to publish messages to RabbitMQ exchanges/queues.
- **Create Queues**: Provides endpoints to create queues and bind them to exchanges.
- **Test Messages**: Includes a test endpoint for quick message publishing.
- **Event Listener**: Automatically listens to and processes test events.

### Publisher Microservice (Fastify)
- **Publish Messages**: Sends messages to the Centralized RabbitMQ Service via HTTP requests.
- **Batch Publishing**: Supports publishing multiple messages in a single request.
- **Message Types**: Supports events, commands, and notifications.

### Consumer Microservice (Fastify)
- **Consume Messages**: Listens to queues and processes messages from the Centralized RabbitMQ Service.
- **Error Handling**: Implements retry logic and dead-letter queues for failed messages.
- **Custom Handlers**: Allows adding custom message handlers for different message types.

---

## Architecture Overview

### Flow
1. **Producer** (Fastify Microservice) sends a POST request to the **Centralized RabbitMQ Service** (NestJS).
2. The Centralized Service publishes the message to RabbitMQ.
3. The message is stored in a **queue** in RabbitMQ.
4. The **Consumer** (Fastify Microservice) listens to the queue and processes the message.

### Benefits
- **Centralized Management**: All RabbitMQ operations are handled by a single service.
- **Decoupling**: Microservices are decoupled from RabbitMQ configuration.
- **Scalability**: The Centralized Service can be scaled independently.
- **Consistency**: Ensures consistent message formatting and routing rules.

---

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- RabbitMQ (Docker recommended)
- Docker (optional, for RabbitMQ)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/noahwillson/centralized-rabbitmq-microservices.git
   cd centralized-rabbitmq-microservices
   ```

2. Install dependencies for each service:
   ```bash
   cd centralized-service && npm install
   cd ../rabbitmq-publisher && npm install
   cd ../rabbitmq-consumer && npm install
   ```

3. Start RabbitMQ using Docker:
   ```bash
   docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
   ```

4. Configure environment variables:
   - Create `.env` files in each service directory with the following content:
     ```
     RABBITMQ_URI=amqp://localhost:5672
     PORT=3000  # For centralized-service
     PORT=3001  # For rabbitmq-consumer
     PORT=3002  # For rabbitmq-publisher
     ```

### Running the Services

1. Start the Centralized RabbitMQ Service:
   ```bash
   cd centralized-service
   npm run start
   ```

2. Start the Consumer Microservice:
   ```bash
   cd ../rabbitmq-consumer
   npm run start
   ```

3. Start the Publisher Microservice:
   ```bash
   cd ../rabbitmq-publisher
   npm run start
   ```

---

## Usage

### Publish a Message

Use the Publisher Microservice to send a message:

```bash
curl -X POST http://localhost:3002/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user.created",
    "data": {
      "userId": "123",
      "username": "john_doe",
      "email": "john@example.com"
    }
  }'
```

### Create a Queue

Use the Centralized Service to create a queue:

```bash
curl -X POST http://localhost:3000/rabbitmq/create-queue \
  -H "Content-Type: application/json" \
  -d '{
    "queueName": "user-events-queue",
    "exchange": "events",
    "routingKey": "user.#"
  }'
```

### Consume Messages

The Consumer Microservice automatically listens to the queue and processes messages. Check the logs to see the processed messages.

---

## Example Use Case

### 1. Create a Queue and Bind it to an Exchange

```bash
curl -X POST http://localhost:3000/rabbitmq/create-queue \
  -H "Content-Type: application/json" \
  -d '{
    "queueName": "user-events-queue",
    "exchange": "events",
    "routingKey": "user.#"
  }'
```

### 2. Publish a Message

```bash
curl -X POST http://localhost:3002/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user.created",
    "data": {
      "userId": "123",
      "username": "john_doe",
      "email": "john@example.com"
    }
  }'
```

### 3. Process the Message

The Consumer Microservice processes the message and logs it:

```
Received user event: {
  type: 'user.created',
  data: {
    userId: '123',
    username: 'john_doe',
    email: 'john@example.com'
  },
  timestamp: '2023-05-15T12:34:56.789Z',
  id: 'abcdef123456'
}
Processing user event: {...}
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeatureName`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/YourFeatureName`).
5. Open a pull request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [NestJS](https://nestjs.com/) for the centralized service.
- [Fastify](https://www.fastify.io/) for the microservices.
- [RabbitMQ](https://www.rabbitmq.com/) for message queuing.

---

## Contact

For questions or feedback, please open an issue or contact the maintainer.

---
