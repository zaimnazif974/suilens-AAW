import amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'suilens.events';

let channel: amqplib.Channel | null = null;

async function getChannel(): Promise<amqplib.Channel> {
  if (channel) return channel;

  let retries = 5;
  while (retries > 0) {
    try {
      const connection = await amqplib.connect(RABBITMQ_URL);
      channel = await connection.createChannel();
      await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
      return channel;
    } catch (error: any) {
      console.error(`RabbitMQ connection failed, retrying in 5s... (${retries} retries left):`, error.message);
      retries -= 1;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  throw new Error('Could not establish RabbitMQ connection');
}

export async function publishEvent(routingKey: string, payload: Record<string, any>) {
  const ch = await getChannel();
  const message = JSON.stringify({
    event: routingKey,
    timestamp: new Date().toISOString(),
    data: payload,
  });
  ch.publish(EXCHANGE_NAME, routingKey, Buffer.from(message), {
    persistent: true,
    contentType: 'application/json',
  });
  console.log(`Published event: ${routingKey}`, payload);
}
