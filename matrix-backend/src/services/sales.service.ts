import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import {
  sales,
  salesItems,
  daybooks,
  daybookGroups,
  accounts,
} from "../db/schema";

export class SalesService {
  async getSales() {
    const rows = await db
      .select({
        sale: sales,
        daybook: daybooks,
        daybookGroup: daybookGroups,
        account: accounts,
      })
      .from(sales)
      .leftJoin(daybooks, eq(sales.daybookId, daybooks.id))
      .leftJoin(daybookGroups, eq(daybooks.daybookGroupId, daybookGroups.id))
      .leftJoin(accounts, eq(sales.accountId, accounts.id))
      .orderBy(desc(sales.createdAt));

    return rows.map(({ sale, daybook, daybookGroup, account }) => ({
      ...sale,
      daybookName: daybook?.daybookName || null,
      daybookGroupName: daybookGroup?.groupName || null,
      accountName: account?.accountName || null,
    }));
  }

  async getSaleById(id: number) {
    const sale = await db.query.sales.findFirst({
      where: eq(sales.id, id),
    });

    if (!sale) return null;

    const items = await db.query.salesItems.findMany({
      where: eq(salesItems.saleId, id),
    });

    return {
      ...sale,
      itemLines: items,
    };
  }

  async createSale(data: any) {
    return await db.transaction(async (tx) => {
      const { itemLines, ...saleData } = data;

      // Insert sale header
      const [newSale] = await tx
        .insert(sales)
        .values({
          ...saleData,
          voucherDate: new Date(saleData.voucherDate),
          dueDate: saleData.dueDate ? new Date(saleData.dueDate) : undefined,
        })
        .returning();

      if (itemLines && itemLines.length > 0) {
        const itemsToInsert = itemLines.map((item: any) => ({
          ...item,
          saleId: newSale.id,
          id: undefined,
        }));

        await tx.insert(salesItems).values(itemsToInsert);
      }

      return newSale;
    });
  }

  async updateSale(id: number, data: any) {
    return await db.transaction(async (tx) => {
      const { itemLines, ...saleData } = data;

      // Update sale header
      const [updatedSale] = await tx
        .update(sales)
        .set({
          ...saleData,
          voucherDate: saleData.voucherDate
            ? new Date(saleData.voucherDate)
            : undefined,
          dueDate: saleData.dueDate ? new Date(saleData.dueDate) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(sales.id, id))
        .returning();

      if (!updatedSale) {
        return null;
      }

      // Handle line items: For simplicity, delete old and re-insert new
      if (itemLines) {
        await tx.delete(salesItems).where(eq(salesItems.saleId, id));

        if (itemLines.length > 0) {
          const itemsToInsert = itemLines.map((item: any) => ({
            ...item,
            saleId: id,
            id: undefined, // Let DB generate new ID
          }));

          await tx.insert(salesItems).values(itemsToInsert);
        }
      }

      return updatedSale;
    });
  }

  async deleteSale(id: number) {
    return await db.transaction(async (tx) => {
      // Delete line items first due to foreign key constraints
      await tx.delete(salesItems).where(eq(salesItems.saleId, id));

      // Delete the sale header
      const [deletedSale] = await tx
        .delete(sales)
        .where(eq(sales.id, id))
        .returning();

      return deletedSale;
    });
  }
}

export const salesService = new SalesService();
