import amqplib from 'amqplib';
import { db } from './db';
import { inventory, processedEvents } from './db/schema';
import { eq, sql } from 'drizzle-orm';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const EXCHANGE_NAME = 'suilens.events';
const QUEUE_NAME = 'inventory.order_events';

let channel: amqplib.Channel | null = null;

async function getChannel(): Promise<amqplib.Channel> {
    if (channel) return channel;
    const connection = await amqplib.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    return channel;
}

export async function setupEventConsumers() {
    const ch = await getChannel();
    await ch.assertQueue(QUEUE_NAME, { durable: true });
    // bind to the order.cancelled routing key
    await ch.bindQueue(QUEUE_NAME, EXCHANGE_NAME, 'order.cancelled');

    console.log('Inventory service listening for events...');

    ch.consume(QUEUE_NAME, async (msg) => {
        if (!msg) return;

        try {
            const payload = JSON.parse(msg.content.toString());
            const { event, data } = payload;

            if (event === 'order.cancelled') {
                const { orderId, lensId, branchCode } = data;
                const eventId = msg.properties.messageId || orderId; // Ideally messageId if published

                // Idempotency check 
                // We begin by checking if we have processed this event
                const existingEvent = await db.select().from(processedEvents).where(eq(processedEvents.eventId, eventId));

                if (existingEvent.length === 0) {
                    console.log(`Processing order.cancelled for order ${orderId}, lens ${lensId}, branch ${branchCode}`);

                    await db.transaction(async (tx) => {
                        // Un-reserve the stock (increase availableQuantity)
                        await tx.update(inventory)
                            .set({
                                availableQuantity: sql`${inventory.availableQuantity} + 1`,
                                updatedAt: new Date()
                            })
                            .where(
                                sql`${inventory.lensId} = ${lensId} AND ${inventory.branchCode} = ${branchCode}`
                            );

                        // Record the event as processed
                        await tx.insert(processedEvents).values({
                            eventId: eventId,
                            eventType: 'order.cancelled',
                        });
                    });

                    console.log(`Successfully released stock for order ${orderId}`);
                } else {
                    console.log(`Event ${eventId} already processed, skipping.`);
                }
            }

            ch.ack(msg);
        } catch (error) {
            console.error('Error processing message:', error);
            // Nack with requeue if it's an unexpected error, but be careful of poison pills
            ch.nack(msg, false, false);
        }
    });
}
