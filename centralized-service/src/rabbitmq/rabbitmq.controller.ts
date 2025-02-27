import { Controller, Post, Body, Param } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { rabbitmqConfig } from 'src/config/rabbitmq.config';

@Controller('rabbitmq')
export class RabbitMQController {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  @Post('publish/:exchange/:routingKey')
  async publishMessage(
    @Param('exchange') exchange: string,
    @Param('routingKey') routingKey: string,
    @Body() message: any,
  ) {
    await this.rabbitMQService.publish(exchange, routingKey, message);
    return { success: true, message: 'Message published successfully' };
  }

  @Post('queue')
  async createQueue(
    @Body()
    queueConfig: {
      queueName: string;
      exchange: string;
      routingKey: string;
    },
  ) {
    const { queueName, exchange, routingKey } = queueConfig;
    await this.rabbitMQService.createQueue(queueName, exchange, routingKey);
    return {
      success: true,
      message: `Queue ${queueName} created and bound to exchange ${exchange} with routing key ${routingKey}`,
    };
  }

  // This endpoint is for testing purposes
  @Post('test-message')
  async sendTestMessage(@Body() body: { message: string }) {
    await this.rabbitMQService.publish(
      rabbitmqConfig.exchanges.events.name,
      'test.event',
      { content: body.message, timestamp: new Date() },
    );
    return { success: true, message: 'Test message sent' };
  }
}
