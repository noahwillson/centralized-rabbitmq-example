// src/events/events.module.ts
import { Module } from '@nestjs/common';
import { EventListenerService } from './event-listener.service';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [RabbitMQModule], // Import the RabbitMQModule to use its services
  providers: [EventListenerService],
  exports: [EventListenerService],
})
export class EventsModule {}
