import { eq } from "drizzle-orm";
import { db } from "../db";
import { daybookGroups, daybooks } from "../db/schema";

export class DaybookService {
  async getDaybookGroups() {
    return await db.select().from(daybookGroups).orderBy(daybookGroups.id);
  }

  async getDaybookGroupById(id: number) {
    const [group] = await db
      .select()
      .from(daybookGroups)
      .where(eq(daybookGroups.id, id));
    return group;
  }

  async createDaybookGroup(data: any) {
    const [created] = await db.insert(daybookGroups).values(data).returning();
    return created;
  }

  async updateDaybookGroup(id: number, data: any) {
    const { id: _, createdAt, updatedAt, ...updateData } = data;
    const [updated] = await db
      .update(daybookGroups)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(daybookGroups.id, id))
      .returning();
    return updated;
  }

  async deleteDaybookGroup(id: number) {
    const [deleted] = await db
      .delete(daybookGroups)
      .where(eq(daybookGroups.id, id))
      .returning();
    return deleted;
  }

  // --- Daybooks CRUD ---
  async getDaybooks() {
    return await db.select().from(daybooks).orderBy(daybooks.id);
  }

  async getDaybookById(id: number) {
    const [daybook] = await db
      .select()
      .from(daybooks)
      .where(eq(daybooks.id, id));
    return daybook;
  }

  async createDaybook(data: any) {
    const [created] = await db.insert(daybooks).values(data).returning();
    return created;
  }

  async updateDaybook(id: number, data: any) {
    const { id: _, createdAt, updatedAt, ...updateData } = data;
    const [updated] = await db
      .update(daybooks)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(daybooks.id, id))
      .returning();
    return updated;
  }

  async deleteDaybook(id: number) {
    const [deleted] = await db
      .delete(daybooks)
      .where(eq(daybooks.id, id))
      .returning();
    return deleted;
  }

  async generateVoucherNo(daybookId: number) {
    const daybook = await this.getDaybookById(daybookId);
    if (!daybook) {
      throw new Error("Daybook not found");
    }

    const prefix = daybook.voucherPrefix || "VCH";
    const randomNum = Math.floor(100 + Math.random() * 900);
    const voucherNo = `${prefix}-${randomNum}`;

    return {
      voucherNo,
      daybookId,
      voucherPrefix: prefix,
    };
  }
}

export const daybookService = new DaybookService();
