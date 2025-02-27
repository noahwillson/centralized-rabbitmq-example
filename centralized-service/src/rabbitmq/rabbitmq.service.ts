import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { Channel } from 'amqplib';
import { rabbitmqConfig } from '../config/rabbitmq.config';
import { PublishOptions } from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;

  async onModuleInit() {
    try {
      this.connection = amqp.connect([rabbitmqConfig.uri], {
        heartbeatIntervalInSeconds: 5,
        reconnectTimeInSeconds: 5,
      });

      this.connection.on('connect', () => {
        this.logger.log('Connected to RabbitMQ');
      });

      this.connection.on('disconnect', (err) => {
        this.logger.error('Disconnected from RabbitMQ', err);
      });

      this.channelWrapper = this.connection.createChannel({
        setup: async (channel: Channel) => {
          await this.setupExchanges(channel);
        },
      });

      await this.channelWrapper.waitForConnect();
      this.logger.log('RabbitMQ channel established');
    } catch (error) {
      this.logger.error('Failed to initialize RabbitMQ connection', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.channelWrapper?.close();
    await this.connection?.close();
    this.logger.log('RabbitMQ connection closed');
  }

  private async setupExchanges(channel: Channel) {
    for (const exchange of Object.values(rabbitmqConfig.exchanges)) {
      await channel.assertExchange(exchange.name, exchange.type, {
        durable: true,
      });
      this.logger.log(`Exchange ${exchange.name} asserted`);
    }
  }

  async publish(
    exchange: string,
    routingKey: string,
    message: any,
    options = {},
  ) {
    try {
      const buffer = Buffer.from(JSON.stringify(message));

      const publishOptions: PublishOptions = { ...options, persistent: true };
      await this.channelWrapper.publish(
        exchange,
        routingKey,
        buffer,
        publishOptions,
      );
      this.logger.debug(
        `Message published to exchange ${exchange} with routing key ${routingKey}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error publishing message to exchange ${exchange} with routing key ${routingKey}`,
        error,
      );
      throw error;
    }
  }

  async createQueue(
    queueName: string,
    exchange: string,
    routingKey: string,
    options = {},
  ) {
    return this.channelWrapper.addSetup(async (channel: Channel) => {
      await channel.assertQueue(queueName, { durable: true, ...options });
      await channel.bindQueue(queueName, exchange, routingKey);
      this.logger.log(
        `Queue ${queueName} bound to exchange ${exchange} with routing key ${routingKey}`,
      );
    });
  }

  async consume(
    queueName: string,
    onMessage: (msg: any) => Promise<void>,
    options = {},
  ) {
    return this.channelWrapper.addSetup(async (channel: Channel) => {
      await channel.assertQueue(queueName, { durable: true });
      await channel.consume(
        queueName,
        async (msg) => {
          if (msg) {
            try {
              const content = JSON.parse(msg.content.toString());
              await onMessage(content);
              channel.ack(msg);
            } catch (error) {
              this.logger.error(
                `Error processing message from queue ${queueName}`,
                error,
              );
              channel.nack(msg, false, false);
            }
          }
        },
        { ...options },
      );
      this.logger.log(`Consuming from queue ${queueName}`);
    });
  }
}
