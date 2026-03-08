import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { db } from './db';
import { orders } from './db/schema';
import { eq } from 'drizzle-orm';
import { publishEvent } from './events';

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3001';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3004';

interface CatalogLens {
  id: string;
  modelName: string;
  manufacturerName: string;
  dayPrice: string;
}

const app = new Elysia()
  .use(cors())
  .post('/api/orders', async ({ body }) => {
    const lensResponse = await fetch(`${CATALOG_SERVICE_URL}/api/lenses/${body.lensId}`);
    if (!lensResponse.ok) {
      return new Response(JSON.stringify({ error: 'Lens not found' }), { status: 404 });
    }
    const lens = await lensResponse.json() as CatalogLens;

    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) {
      return new Response(
        JSON.stringify({ error: 'End date must be after start date' }),
        { status: 400 }
      );
    }
    const totalPrice = (days * parseFloat(lens.dayPrice)).toFixed(2);

    // Reserve inventory
    const inventoryResponse = await fetch(`${INVENTORY_SERVICE_URL}/api/inventory/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lensId: body.lensId,
        branchCode: body.branchCode,
        quantity: 1
      })
    });

    if (!inventoryResponse.ok) {
      const errorData = await inventoryResponse.json().catch(() => ({})) as any;
      return new Response(JSON.stringify({ error: errorData.error || 'Failed to reserve inventory' }), { status: 400 });
    }

    const [order] = await db.insert(orders).values({
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      lensId: body.lensId,
      branchCode: body.branchCode,
      lensSnapshot: {
        modelName: lens.modelName,
        manufacturerName: lens.manufacturerName,
        dayPrice: lens.dayPrice,
      },
      startDate: start,
      endDate: end,
      totalPrice,
    }).returning();
    if (!order) {
      return new Response(JSON.stringify({ error: 'Failed to create order' }), { status: 500 });
    }

    //Publish Event
    await publishEvent('order.placed', {
      orderId: order.id,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      lensName: lens.modelName,
    });

    return new Response(JSON.stringify(order), { status: 201 });
  }, {
    body: t.Object({
      customerName: t.String(),
      customerEmail: t.String({ format: 'email' }),
      lensId: t.String({ format: 'uuid' }),
      branchCode: t.String(),
      startDate: t.String(),
      endDate: t.String(),
    }),
  })
  .patch('/api/orders/:id/cancel', async ({ params }: { params: { id: string } }) => {
    const [order] = await db.update(orders)
      .set({ status: 'cancelled' })
      .where(eq(orders.id, params.id))
      .returning();

    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
    }

    await publishEvent('order.cancelled', {
      orderId: order.id,
      lensId: order.lensId,
      branchCode: order.branchCode,
    });

    return new Response(JSON.stringify(order), { status: 200 });
  })
  .get('/api/orders', async () => db.select().from(orders))
  .get('/api/orders/:id', async ({ params }) => {
    const results = await db.select().from(orders).where(eq(orders.id, params.id));
    if (!results[0]) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
    }
    return results[0];
  })
  .get('/health', () => ({ status: 'ok', service: 'order-service' }))
  .listen(3002);

console.log(`Order Service running on port ${app.server?.port}`);
