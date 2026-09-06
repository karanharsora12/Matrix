import { and, eq, sql } from "drizzle-orm";
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

  async generateVoucherNo(params: {
    daybookId?: number | undefined;
    daybookGroupId?: number | undefined;
    tableName?: string | undefined;
  }) {
    let daybook: any = null;
    if (params.daybookId) {
      daybook = await this.getDaybookById(params.daybookId);
    } else if (params.daybookGroupId) {
      const [firstDaybook] = await db
        .select()
        .from(daybooks)
        .where(
          and(
            eq(daybooks.daybookGroupId, params.daybookGroupId),
            eq(daybooks.isActive, true),
          ),
        )
        .limit(1);
      daybook = firstDaybook;
    }

    if (!daybook) {
      throw new Error("Daybook not found");
    }

    const prefix = (daybook.voucherPrefix || "VCH").trim();
    const rawTableName = (params.tableName || "sales").trim().toLowerCase();

    // Sanitize table name against safe identifier pattern
    if (!/^[a-zA-Z0-9_]+$/.test(rawTableName)) {
      throw new Error("Invalid table name");
    }

    const colCheck = await db.execute(
      sql`SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = ${rawTableName} 
          AND column_name IN ('sr_no', 'daybook_id')`,
    );

    const cols = (colCheck.rows as any[]).map((r) => r.column_name);
    const hasSrNo = cols.includes("sr_no");
    const hasDaybookId = cols.includes("daybook_id");

    let nextSrNo = 1;
    if (hasSrNo) {
      let query;
      if (hasDaybookId && daybook.id) {
        query = sql`SELECT COALESCE(MAX(sr_no), 0) as max_sr FROM ${sql.raw(rawTableName)} WHERE daybook_id = ${daybook.id}`;
      } else {
        query = sql`SELECT COALESCE(MAX(sr_no), 0) as max_sr FROM ${sql.raw(rawTableName)}`;
      }
      const maxResult = await db.execute(query);
      const maxSr = Number(maxResult.rows[0]?.max_sr || 0);
      nextSrNo = maxSr + 1;
    }

    const voucherNo =
      prefix.endsWith("-") || prefix.endsWith("/")
        ? `${prefix}${nextSrNo}`
        : `${prefix}-${nextSrNo}`;

    return {
      voucherNo,
      srNo: nextSrNo,
      daybookId: daybook.id,
      daybookGroupId: daybook.daybookGroupId,
      voucherPrefix: prefix,
      tableName: rawTableName,
    };
  }
}

export const daybookService = new DaybookService();
