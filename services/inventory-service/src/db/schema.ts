import { pgTable, uuid, varchar, numeric, timestamp, integer } from 'drizzle-orm/pg-core';

export const inventory = pgTable('inventory', {
    id: uuid('id').primaryKey().defaultRandom(),
    lensId: uuid('lens_id').notNull(),
    branchCode: varchar('branch_code', { length: 50 }).notNull(),
    totalQuantity: integer('total_quantity').notNull().default(0),
    availableQuantity: integer('available_quantity').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const processedEvents = pgTable('processed_events', {
    eventId: varchar('event_id', { length: 255 }).primaryKey(),
    eventType: varchar('event_type', { length: 255 }).notNull(),
    processedAt: timestamp('processed_at').defaultNow().notNull(),
});
