import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "../db";
import {
  accounts,
  daybookGroups,
  daybooks,
  itemGroups,
  items,
  orderItems,
  orders,
  rateTypes,
  sales,
  salesItems,
} from "../db/schema";

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
    if (hasDaybookId && daybook.id) {
      const latestResult = await db.execute(
        sql`SELECT sr_no FROM ${sql.raw(rawTableName)} WHERE daybook_id = ${daybook.id} ORDER BY id DESC LIMIT 1`,
      );
      const latestRow = latestResult.rows[0] as any;
      if (
        latestRow &&
        latestRow.sr_no != null &&
        !isNaN(Number(latestRow.sr_no))
      ) {
        nextSrNo = Number(latestRow.sr_no) + 1;
      } else {
        nextSrNo = 1;
      }
    } else if (hasSrNo) {
      const latestResult = await db.execute(
        sql`SELECT sr_no FROM ${sql.raw(rawTableName)} ORDER BY id DESC LIMIT 1`,
      );
      const latestRow = latestResult.rows[0] as any;
      if (
        latestRow &&
        latestRow.sr_no != null &&
        !isNaN(Number(latestRow.sr_no))
      ) {
        nextSrNo = Number(latestRow.sr_no) + 1;
      } else {
        nextSrNo = 1;
      }
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

  // --- Common Daybook References API ---
  async getDaybookReferences(params: {
    daybookGroupId?: number | string | undefined;
    daybookGroupShortName?: string | undefined;
    daybookId?: number | string | undefined;
    daybookShortName?: string | undefined;
    sourceType?: "orders" | "sales" | "purchases" | "auto" | undefined;
    accountId?: number | undefined;
    voucherNo?: string | undefined;
    search?: string | undefined;
    status?: "pending" | "all" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
  }) {
    let resolvedGroup: any = null;
    let targetDaybooks: any[] = [];

    // 1. Resolve Day Book Group if provided
    if (params.daybookGroupId) {
      resolvedGroup = await this.getDaybookGroupById(
        Number(params.daybookGroupId),
      );
      if (resolvedGroup) {
        targetDaybooks = await db
          .select()
          .from(daybooks)
          .where(eq(daybooks.daybookGroupId, resolvedGroup.id));
      }
    } else if (params.daybookGroupShortName) {
      const [grp] = await db
        .select()
        .from(daybookGroups)
        .where(
          sql`lower(${daybookGroups.shortName}) = lower(${params.daybookGroupShortName})`,
        );
      if (grp) {
        resolvedGroup = grp;
        targetDaybooks = await db
          .select()
          .from(daybooks)
          .where(eq(daybooks.daybookGroupId, grp.id));
      }
    }

    // 2. Resolve Daybook if provided
    let singleDaybook: any = null;
    if (params.daybookId) {
      singleDaybook = await this.getDaybookById(Number(params.daybookId));
      if (singleDaybook) {
        targetDaybooks = [singleDaybook];
        if (!resolvedGroup && singleDaybook.daybookGroupId) {
          resolvedGroup = await this.getDaybookGroupById(
            singleDaybook.daybookGroupId,
          );
        }
      }
    } else if (params.daybookShortName) {
      const [d] = await db
        .select()
        .from(daybooks)
        .where(
          sql`lower(${daybooks.shortName}) = lower(${params.daybookShortName})`,
        );
      if (d) {
        singleDaybook = d;
        targetDaybooks = [d];
        if (!resolvedGroup && d.daybookGroupId) {
          resolvedGroup = await this.getDaybookGroupById(d.daybookGroupId);
        }
      }
    }

    // 3. Determine underlying table (orders / sales / purchases)
    let source = (params.sourceType || "auto").toLowerCase();
    if (source === "auto") {
      const gShort = (resolvedGroup?.shortName || "").toUpperCase();
      const dShort = (singleDaybook?.shortName || "").toUpperCase();
      if (
        gShort === "REP" ||
        dShort === "REPRCT" ||
        singleDaybook?.voucherPrefix === "RR-"
      ) {
        // Repairing Receipts are in orders table
        source = "orders";
      } else if (gShort === "ORD") {
        source = "orders";
      } else if (gShort === "SAL" || dShort === "REPBIL") {
        source = "sales";
      } else if (gShort === "PUR") {
        source = "purchases";
      } else {
        source = "orders";
      }
    }

    const limit = Math.min(100, Math.max(1, params.limit || 50));
    const page = Math.max(1, params.page || 1);

    // 4. Query from orders table (e.g. Repairing Receipt, Orders)
    if (source === "orders") {
      const conditions: any[] = [];
      const daybookIds = targetDaybooks.map((d) => d.id);

      // Filter daybooks in this group if specific daybook or group was resolved
      // For Repairing Receipt, prioritize receipt daybooks (e.g. REPRCT)
      if (daybookIds.length > 0) {
        const receiptDaybooks = targetDaybooks.filter(
          (d) =>
            d.shortName?.toUpperCase().includes("RCT") ||
            d.daybookName?.toLowerCase().includes("receipt"),
        );
        const filteredIds =
          receiptDaybooks.length > 0
            ? receiptDaybooks.map((d) => d.id)
            : daybookIds;
        conditions.push(inArray(orders.daybookId, filteredIds));
      }

      if (params.accountId) {
        conditions.push(eq(orders.accountId, Number(params.accountId)));
      }
      if (params.voucherNo) {
        conditions.push(
          ilike(orders.voucherNo, `%${params.voucherNo.trim()}%`),
        );
      }
      if (params.search) {
        const s = `%${params.search.trim()}%`;
        conditions.push(
          or(
            ilike(orders.voucherNo, s),
            ilike(accounts.accountName, s),
            ilike(orders.reference, s),
          ),
        );
      }

      const rows = await db
        .select({
          order: orders,
          account: accounts,
          daybook: daybooks,
          daybookGroup: daybookGroups,
        })
        .from(orders)
        .leftJoin(accounts, eq(orders.accountId, accounts.id))
        .leftJoin(daybooks, eq(orders.daybookId, daybooks.id))
        .leftJoin(daybookGroups, eq(daybooks.daybookGroupId, daybookGroups.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(orders.id))
        .limit(limit)
        .offset((page - 1) * limit);

      if (rows.length === 0) return [];

      const orderIds = rows.map((r) => r.order.id);
      const voucherNos = rows.map((r) => r.order.voucherNo);

      // Fetch items for all matched orders
      const fetchedItems = await db
        .select({
          item: orderItems,
          itemGroupName: itemGroups.itemGroupName,
          itemName: items.itemName,
          rateTypeName: rateTypes.name,
        })
        .from(orderItems)
        .leftJoin(itemGroups, eq(orderItems.itemGroupId, itemGroups.id))
        .leftJoin(items, eq(orderItems.itemId, items.id))
        .leftJoin(rateTypes, eq(orderItems.rateTypeId, rateTypes.id))
        .where(inArray(orderItems.orderId, orderIds));

      const itemsByOrderId = new Map<number, any[]>();
      for (const it of fetchedItems) {
        const oId = it.item.orderId;
        if (!itemsByOrderId.has(oId)) itemsByOrderId.set(oId, []);
        itemsByOrderId.get(oId)!.push({
          id: it.item.id,
          sourceItemId: it.item.id,
          itemId: it.item.itemId,
          itemName: it.itemName || "",
          itemCode: it.item.tagNo || "",
          itemGroupId: it.item.itemGroupId || 0,
          itemGroupName: it.itemGroupName || "",
          tagNo: it.item.tagNo || "",
          pcs: Number(it.item.pcs ?? 1),
          uom: it.item.uom || "",
          weight: Number(it.item.weight ?? 0),
          grossWt: Number(it.item.grossWt ?? 0),
          netWt: Number(it.item.netWt ?? 0),
          adjustedWt: Number(it.item.adjustedWt ?? 0),
          rate: Number(it.item.rate ?? 0),
          rateTypeId: it.item.rateTypeId,
          rateType: it.rateTypeName || it.item.rateType || "",
          tax: it.item.tax || "",
          labourAmount: Number(it.item.labourAmount ?? 0),
          otherAmount: Number(it.item.otherAmount ?? 0),
          discountAmount: Number(it.item.discountAmount ?? 0),
          amount: Number(it.item.amount ?? 0),
        });
      }

      // Check which vouchers are already referenced in sales
      const referencedSales = await db
        .select({ reference: sales.reference, voucherNo: sales.voucherNo })
        .from(sales)
        .where(inArray(sales.reference, voucherNos));

      const refMap = new Map<string, string>();
      for (const s of referencedSales) {
        if (s.reference) refMap.set(s.reference, s.voucherNo);
      }

      const results = rows.map(
        ({ order, account, daybook: dbk, daybookGroup: grp }) => {
          const isReferenced = refMap.has(order.voucherNo);
          const lines = itemsByOrderId.get(order.id) || [];
          const totalLabour = lines.reduce(
            (sum, line) => sum + (line.labourAmount || 0),
            0,
          );

          return {
            id: order.id,
            sourceType: "orders",
            voucherNo: order.voucherNo,
            voucherDate: order.voucherDate,
            dueDate: order.dueDate,
            daybookId: order.daybookId,
            daybookName: dbk?.daybookName || "Repairing Receipt",
            daybookShortName: dbk?.shortName || "REPRCT",
            daybookGroupId: grp?.id,
            daybookGroupName: grp?.groupName || "Repairing",
            accountId: order.accountId,
            accountName: account?.accountName || "",
            customerPhone: account?.userName || "",
            customerEmail: account?.email || "",
            salesmanName: order.salesmanName || "",
            reference: order.reference || "",
            remarks: order.remarks || "",
            subtotal: Number(order.subtotal ?? 0),
            discountRate: Number(order.discountRate ?? 0),
            discountAmount: Number(order.discountAmount ?? 0),
            taxRate: Number(order.taxRate ?? 0),
            taxAmount: Number(order.taxAmount ?? 0),
            roundOff: Number(order.roundOff ?? 0),
            grandTotal: Number(order.grandTotal ?? 0),
            advanceAmount: Number(order.advanceAmount ?? 0),
            totalLabour,
            itemCount: lines.length,
            isReferenced,
            referencedInVoucherNo: refMap.get(order.voucherNo) || null,
            itemLines: lines,
          };
        },
      );

      if (params.status === "pending") {
        return results.filter((r) => !r.isReferenced);
      }

      return results;
    }

    // 5. Query from sales table
    if (source === "sales") {
      const conditions: any[] = [];
      const daybookIds = targetDaybooks.map((d) => d.id);
      if (daybookIds.length > 0) {
        conditions.push(inArray(sales.daybookId, daybookIds));
      }
      if (params.accountId) {
        conditions.push(eq(sales.accountId, Number(params.accountId)));
      }
      if (params.voucherNo) {
        conditions.push(ilike(sales.voucherNo, `%${params.voucherNo.trim()}%`));
      }
      if (params.search) {
        const s = `%${params.search.trim()}%`;
        conditions.push(
          or(
            ilike(sales.voucherNo, s),
            ilike(accounts.accountName, s),
            ilike(sales.reference, s),
          ),
        );
      }

      const rows = await db
        .select({
          sale: sales,
          account: accounts,
          daybook: daybooks,
          daybookGroup: daybookGroups,
        })
        .from(sales)
        .leftJoin(accounts, eq(sales.accountId, accounts.id))
        .leftJoin(daybooks, eq(sales.daybookId, daybooks.id))
        .leftJoin(daybookGroups, eq(daybooks.daybookGroupId, daybookGroups.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(sales.id))
        .limit(limit)
        .offset((page - 1) * limit);

      if (rows.length === 0) return [];

      const saleIds = rows.map((r) => r.sale.id);
      const fetchedItems = await db
        .select({
          item: salesItems,
          itemGroupName: itemGroups.itemGroupName,
          itemName: items.itemName,
          rateTypeName: rateTypes.name,
        })
        .from(salesItems)
        .leftJoin(itemGroups, eq(salesItems.itemGroupId, itemGroups.id))
        .leftJoin(items, eq(salesItems.itemId, items.id))
        .leftJoin(rateTypes, eq(salesItems.rateTypeId, rateTypes.id))
        .where(inArray(salesItems.saleId, saleIds));

      const itemsBySaleId = new Map<number, any[]>();
      for (const it of fetchedItems) {
        const sId = it.item.saleId;
        if (!itemsBySaleId.has(sId)) itemsBySaleId.set(sId, []);
        itemsBySaleId.get(sId)!.push({
          id: it.item.id,
          sourceItemId: it.item.id,
          itemId: it.item.itemId,
          itemName: it.itemName || "",
          itemCode: it.item.tagNo || "",
          itemGroupId: it.item.itemGroupId || 0,
          itemGroupName: it.itemGroupName || "",
          tagNo: it.item.tagNo || "",
          pcs: Number(it.item.pcs ?? 1),
          uom: it.item.uom || "",
          weight: Number(it.item.weight ?? 0),
          grossWt: Number(it.item.grossWt ?? 0),
          netWt: Number(it.item.netWt ?? 0),
          adjustedWt: Number(it.item.adjustedWt ?? 0),
          rate: Number(it.item.rate ?? 0),
          rateTypeId: it.item.rateTypeId,
          rateType: it.rateTypeName || it.item.rateType || "",
          tax: it.item.tax || "",
          labourAmount: Number(it.item.labourAmount ?? 0),
          otherAmount: Number(it.item.otherAmount ?? 0),
          discountAmount: Number(it.item.discountAmount ?? 0),
          amount: Number(it.item.amount ?? 0),
        });
      }

      return rows.map(
        ({ sale, account, daybook: dbk, daybookGroup: grp }) => {
          const lines = itemsBySaleId.get(sale.id) || [];
          const totalLabour = lines.reduce(
            (sum, line) => sum + (line.labourAmount || 0),
            0,
          );
          return {
            id: sale.id,
            sourceType: "sales",
            voucherNo: sale.voucherNo,
            voucherDate: sale.voucherDate,
            dueDate: sale.dueDate,
            daybookId: sale.daybookId,
            daybookName: dbk?.daybookName || "",
            daybookShortName: dbk?.shortName || "",
            daybookGroupId: grp?.id,
            daybookGroupName: grp?.groupName || "",
            accountId: sale.accountId,
            accountName: account?.accountName || "",
            customerPhone: account?.userName || "",
            customerEmail: account?.email || "",
            salesmanName: sale.salesmanName || "",
            reference: sale.reference || "",
            remarks: sale.remarks || "",
            subtotal: Number(sale.subtotal ?? 0),
            discountRate: Number(sale.discountRate ?? 0),
            discountAmount: Number(sale.discountAmount ?? 0),
            taxRate: Number(sale.taxRate ?? 0),
            taxAmount: Number(sale.taxAmount ?? 0),
            roundOff: Number(sale.roundOff ?? 0),
            grandTotal: Number(sale.grandTotal ?? 0),
            advanceAmount: Number(sale.advanceAmount ?? 0),
            totalLabour,
            itemCount: lines.length,
            isReferenced: false,
            referencedInVoucherNo: null,
            itemLines: lines,
          };
        },
      );
    }

    return [];
  }
}

export const daybookService = new DaybookService();
