import { eq } from "drizzle-orm";
import { db } from "../db";
import { itemGroups, metals, rateTypes, commonLists } from "../db/schema";

export class InventoryService {
  async getMasterData() {
    const [metalsData, rateTypesData, commonListsData] = await Promise.all([
      db.select().from(metals),
      db.select().from(rateTypes),
      db.select().from(commonLists)
    ]);
    return {
      metals: metalsData,
      rateTypes: rateTypesData,
      commonLists: commonListsData,
    };
  }

  async getItemGroups() {
    return await db.select().from(itemGroups).orderBy(itemGroups.id);
  }

  async createItemGroup(data: any) {
    const [created] = await db
      .insert(itemGroups)
      .values(data)
      .returning();
    return created;
  }

  async updateItemGroup(id: number, data: any) {
    const [updated] = await db
      .update(itemGroups)
      .set({ ...data, updatedAt: new Date() })
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
}

export const inventoryService = new InventoryService();
