// src/events/event-listener.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { rabbitmqConfig } from '../config/rabbitmq.config';

@Injectable()
export class EventListenerService implements OnModuleInit {
  private readonly logger = new Logger(EventListenerService.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async onModuleInit() {
    // Create a queue for test events
    await this.rabbitMQService.createQueue(
      'test-events-queue',
      rabbitmqConfig.exchanges.events.name,
      'test.event',
    );

    // Start consuming messages
    await this.rabbitMQService.consume('test-events-queue', async (message) => {
      this.logger.log(`Received test event: ${JSON.stringify(message)}`);
      // Process the message
      const result = await JSON.stringify(message);

      console.log('result', result);
    });
  }
}
