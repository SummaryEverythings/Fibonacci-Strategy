import { db } from '../db/index.js';
import { scans } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

export const scanService = {
    async createScan(userId, data) {
        const [newScan] = await db.insert(scans).values({
            userId,
            ...data
        }).returning();
        return newScan;
    },

    async getUserScans(userId) {
        return db.select()
            .from(scans)
            .where(eq(scans.userId, userId))
            .orderBy(desc(scans.createdAt));
    },

    async getScanById(id, userId) {
        const [scan] = await db.select()
            .from(scans)
            .where(and(eq(scans.id, id), eq(scans.userId, userId)));
        return scan;
    },

    async deleteScan(id, userId) {
        const [deletedScan] = await db.delete(scans)
            .where(and(eq(scans.id, id), eq(scans.userId, userId)))
            .returning();
        return deletedScan;
    }
};
