import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { db } from './db';
import { inventory } from './db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { setupEventConsumers } from './consumer';

const app = new Elysia()
    .use(cors())
    .get('/api/inventory/lenses/:lensId', async ({ params, query }) => {
        let results;
        if (query.branchCode) {
            results = await db.select().from(inventory).where(
                and(eq(inventory.branchCode, query.branchCode), eq(inventory.lensId, params.lensId))
            );
        } else {
            results = await db.select().from(inventory).where(eq(inventory.lensId, params.lensId));
        }
        return results;
    }, {
        params: t.Object({
            lensId: t.String({ format: 'uuid' })
        }),
        query: t.Optional(t.Object({
            branchCode: t.Optional(t.String()),
        }))
    })
    .post('/api/inventory/reserve', async ({ body }) => {
        try {
            const result = await db.transaction(async (tx) => {
                const item = await tx.select().from(inventory).where(
                    and(eq(inventory.lensId, body.lensId), eq(inventory.branchCode, body.branchCode))
                );

                const firstItem = item[0];
                if (!firstItem) {
                    throw new Error('Inventory not found for specified lens and branch');
                }

                if (firstItem.availableQuantity < body.quantity) {
                    throw new Error('Insufficient stock in the selected branch');
                }

                const [updated] = await tx.update(inventory)
                    .set({
                        availableQuantity: sql`${inventory.availableQuantity} - ${body.quantity}`,
                        updatedAt: new Date()
                    })
                    .where(
                        and(eq(inventory.lensId, body.lensId), eq(inventory.branchCode, body.branchCode))
                    )
                    .returning();

                return updated;
            });

            return new Response(JSON.stringify(result), { status: 200 });
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 400 });
        }
    }, {
        body: t.Object({
            lensId: t.String({ format: 'uuid' }),
            branchCode: t.String(),
            quantity: t.Number({ default: 1 })
        })
    })
    .post('/api/inventory/release', async ({ body }) => {
        try {
            const [updated] = await db.update(inventory)
                .set({
                    availableQuantity: sql`${inventory.availableQuantity} + ${body.quantity}`,
                    updatedAt: new Date()
                })
                .where(
                    and(eq(inventory.lensId, body.lensId), eq(inventory.branchCode, body.branchCode))
                )
                .returning();

            if (!updated) {
                return new Response(JSON.stringify({ error: 'Failed to update stock' }), { status: 400 });
            }

            return new Response(JSON.stringify(updated), { status: 200 });
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
    }, {
        body: t.Object({
            lensId: t.String({ format: 'uuid' }),
            branchCode: t.String(),
            quantity: t.Number({ default: 1 })
        })
    })
    .get('/health', () => ({ status: 'ok', service: 'inventory-service' }))
    .listen(3004);

console.log(`Inventory Service running on port ${app.server?.port}`);

setupEventConsumers().catch(err => {
    console.error('Failed to setup RabbitMQ consumers:', err);
});
