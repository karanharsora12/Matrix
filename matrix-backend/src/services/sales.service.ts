import { eq, desc, and, notInArray } from "drizzle-orm";
import { db } from "../db";
import {
  sales,
  salesItems,
  daybooks,
  daybookGroups,
  accounts,
  itemGroups,
  items,
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

    const fetchedItems = await db
      .select({
        item: salesItems,
        itemGroupName: itemGroups.itemGroupName,
        itemName: items.itemName,
      })
      .from(salesItems)
      .leftJoin(itemGroups, eq(salesItems.itemGroupId, itemGroups.id))
      .leftJoin(items, eq(salesItems.itemId, items.id))
      .where(eq(salesItems.saleId, id));

    return {
      ...sale,
      itemLines: fetchedItems.map(({ item, itemGroupName, itemName }) => ({
        ...item,
        itemGroupName,
        itemName,
      })),
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

      let insertedItems = [];
      if (itemLines && itemLines.length > 0) {
        const itemsToInsert = itemLines.map((item: any) => {
          const { createdAt, updatedAt, ...rest } = item;
          return {
            ...rest,
            saleId: newSale.id,
            id: undefined,
          };
        });

        insertedItems = await tx
          .insert(salesItems)
          .values(itemsToInsert)
          .returning();
      }

      return {
        ...newSale,
        itemLines: insertedItems,
      };
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

      // Handle line items efficiently
      let finalItems: any[] = [];
      if (itemLines) {
        const idsToKeep = itemLines
          .map((i: any) => i.id)
          .filter((itemId: any) => itemId != null);

        if (idsToKeep.length > 0) {
          await tx
            .delete(salesItems)
            .where(
              and(
                eq(salesItems.saleId, id),
                notInArray(salesItems.id, idsToKeep),
              ),
            );
        } else {
          await tx.delete(salesItems).where(eq(salesItems.saleId, id));
        }

        for (const item of itemLines) {
          const { createdAt, updatedAt, ...rest } = item;
          if (item.id) {
            await tx
              .update(salesItems)
              .set({
                ...rest,
                saleId: id,
                updatedAt: new Date(),
              })
              .where(eq(salesItems.id, item.id));
          } else {
            await tx.insert(salesItems).values({
              ...rest,
              saleId: id,
              id: undefined,
            });
          }
        }

        finalItems = await tx
          .select()
          .from(salesItems)
          .where(eq(salesItems.saleId, id));
      }

      return {
        ...updatedSale,
        itemLines: finalItems,
      };
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
