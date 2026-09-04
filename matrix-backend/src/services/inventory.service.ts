import { eq } from "drizzle-orm";
import { db } from "../db";
import { itemGroups, metals, rateTypes, commonLists, items, attributes } from "../db/schema";

export class InventoryService {
  async getMasterData() {
    const [metalsData, rateTypesData, commonListsData, attributesData] = await Promise.all([
      db.select().from(metals),
      db.select().from(rateTypes),
      db.select().from(commonLists),
      db.select().from(attributes),
    ]);
    return {
      metals: metalsData,
      rateTypes: rateTypesData,
      commonLists: commonListsData,
      attributes: attributesData,
    };
  }

  async getItemGroups() {
    return await db.select().from(itemGroups).orderBy(itemGroups.id);
  }

  async createItemGroup(data: any) {
    const [created] = await db.insert(itemGroups).values(data).returning();
    return created;
  }

  async updateItemGroup(id: number, data: any) {
    const { id: _, createdAt, updatedAt, ...updateData } = data;
    const [updated] = await db
      .update(itemGroups)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(itemGroups.id, id))
      .returning();
    return updated;
  }

  async deleteItemGroup(id: number) {
    const [deleted] = await db
      .delete(itemGroups)
      .where(eq(itemGroups.id, id))
      .returning();
    return deleted;
  }

  async getItems() {
    return await db.select().from(items).orderBy(items.id);
  }

  async createItem(data: any) {
    const [created] = await db.insert(items).values(data).returning();
    return created;
  }

  async updateItem(id: number, data: any) {
    const { id: _, createdAt, updatedAt, ...updateData } = data;
    const [updated] = await db
      .update(items)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning();
    return updated;
  }

  async deleteItem(id: number) {
    const [deleted] = await db
      .delete(items)
      .where(eq(items.id, id))
      .returning();
    return deleted;
  }
}

export const inventoryService = new InventoryService();
