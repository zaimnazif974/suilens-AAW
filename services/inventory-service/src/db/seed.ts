import { db } from './index';
import { inventory } from './schema';
import postgres from 'postgres';

const catalogConnectionString = process.env.CATALOG_DATABASE_URL || 'postgres://catalog:catalog@localhost:15010/catalog';

async function seed() {
    console.log('Seeding inventory data...');

    const catalogClient = postgres(catalogConnectionString);

    try {
        // Fetch all existing lens IDs from the catalog database
        const lenses = await catalogClient`SELECT id FROM lenses`;

        if (lenses.length === 0) {
            console.warn('⚠️ No lenses found in the catalog database. Please run the catalog-service seed script first.');
            process.exit(0);
        }

        const inventoryData: any[] = [];

        for (const lens of lenses) {
            // 1. KB-JKT-S (Main branch, most stock)
            inventoryData.push({
                lensId: lens.id,
                branchCode: 'KB-JKT-S',
                totalQuantity: 50,
                availableQuantity: 50,
            });

            // 2. KB-JKT-E (Second most stock)
            inventoryData.push({
                lensId: lens.id,
                branchCode: 'KB-JKT-E',
                totalQuantity: 30,
                availableQuantity: 30,
            });

            // 3. KB-JKT-N (New branch, limited stock)
            inventoryData.push({
                lensId: lens.id,
                branchCode: 'KB-JKT-N',
                totalQuantity: 10,
                availableQuantity: 10,
            });
        }

        // Insert the generated inventory data into the inventory database
        await db.insert(inventory).values(inventoryData);

        console.log(`✅ Successfully seeded inventory for ${lenses.length} lenses across 3 branches (KB-JKT-S, KB-JKT-E, KB-JKT-N).`);

    } catch (error) {
        console.error('❌ Error seeding inventory:', error);
    } finally {
        // Close the connection to the catalog database
        await catalogClient.end();
        process.exit(0);
    }
}

seed().catch((error) => {
    console.error(error);
    process.exit(1);
});
