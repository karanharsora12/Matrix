import { eq, desc, and, notInArray, count } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db";
import {
  sales,
  salesItems,
  daybooks,
  daybookGroups,
  accounts,
  itemGroups,
  items,
  users,
} from "../db/schema";
const addByUser = alias(users, "sales_add_by_user");
const editByUser = alias(users, "sales_edit_by_user");

function toDate(val: any): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

function formatSaleRow(s: any) {
  return s;
}

function formatSaleItemRow(item: any) {
  return item;
}

export class SalesService {
  async getSales(options?: {
    page?: number;
    limit?: number;
    fetchAll?: boolean;
  }) {
    const page = Math.max(1, options?.page || 1);
    const limit = options?.fetchAll
      ? -1
      : Math.min(100, Math.max(1, options?.limit || 50));

    let query = db
      .select({
        sale: sales,
        daybook: daybooks,
        daybookGroup: daybookGroups,
        account: accounts,
        addByUserName: addByUser.name,
        editByUserName: editByUser.name,
      })
      .from(sales)
      .leftJoin(daybooks, eq(sales.daybookId, daybooks.id))
      .leftJoin(daybookGroups, eq(daybooks.daybookGroupId, daybookGroups.id))
      .leftJoin(accounts, eq(sales.accountId, accounts.id))
      .leftJoin(addByUser, eq(sales.addBy, addByUser.id))
      .leftJoin(editByUser, eq(sales.editBy, editByUser.id))
      .orderBy(desc(sales.createdAt));

    if (!options?.fetchAll && limit !== -1) {
      query = query.limit(limit).offset((page - 1) * limit) as any;
    }

    const [rows, totalResult] = await Promise.all([
      query,
      db.select({ total: count() }).from(sales),
    ]);
    const total = Number(totalResult[0]?.total || 0);

    const data = rows.map(
      ({
        sale,
        daybook,
        daybookGroup,
        account,
        addByUserName,
        editByUserName,
      }) => ({
        ...formatSaleRow(sale),
        daybookName: daybook?.daybookName || null,
        daybookGroupName: daybookGroup?.groupName || null,
        accountName: account?.accountName || null,
        addBy: addByUserName || null,
        editBy: editByUserName || null,
      }),
    );

    return {
      data,
      pagination: {
        page,
        limit: options?.fetchAll || limit === -1 ? total : limit,
        total,
        totalPages:
          options?.fetchAll || limit === -1 ? 1 : Math.ceil(total / limit),
        hasNextPage:
          options?.fetchAll || limit === -1 ? false : page * limit < total,
      },
    };
  }

  async getSaleById(id: number) {
    const [result] = await db
      .select({
        sale: sales,
        account: accounts,
        daybook: daybooks,
      })
      .from(sales)
      .leftJoin(accounts, eq(sales.accountId, accounts.id))
      .leftJoin(daybooks, eq(sales.daybookId, daybooks.id))
      .where(eq(sales.id, id));

    if (!result) return null;

    const { sale, account, daybook } = result;

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
      ...formatSaleRow(sale),
      daybookName: daybook?.daybookName || "",
      accountId: sale.accountId,
      accountName: account?.accountName || "",
      customerPhone: account?.userName || "",
      itemLines: fetchedItems.map(({ item, itemGroupName, itemName }) => ({
        ...formatSaleItemRow(item),
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
          voucherDate: toDate(saleData.voucherDate) || new Date(),
          dueDate: toDate(saleData.dueDate),
          addBy: saleData.addBy ? Number(saleData.addBy) : null,
          editBy: saleData.editBy ? Number(saleData.editBy) : null,
        })
        .returning();

      if (!newSale) {
        throw new Error("Failed to create sale voucher");
      }

      let insertedItems: any[] = [];
      if (itemLines && itemLines.length > 0) {
        const itemsToInsert = itemLines.map((item: any) => {
          const { createdAt, updatedAt, id, ...rest } = item;
          return {
            ...rest,
            saleId: newSale.id,
            addBy: item.addBy ? Number(item.addBy) : null,
            editBy: item.editBy ? Number(item.editBy) : null,
          };
        });

        insertedItems = await tx
          .insert(salesItems)
          .values(itemsToInsert)
          .returning();
      }

      return {
        ...formatSaleRow(newSale),
        itemLines: insertedItems.map(formatSaleItemRow),
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
          voucherDate:
            saleData.voucherDate !== undefined
              ? toDate(saleData.voucherDate) || new Date()
              : undefined,
          dueDate:
            saleData.dueDate !== undefined
              ? toDate(saleData.dueDate)
              : undefined,
          editBy: saleData.editBy ? Number(saleData.editBy) : undefined,
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
                editBy: item.editBy ? Number(item.editBy) : undefined,
                updatedAt: new Date(),
              })
              .where(eq(salesItems.id, item.id));
          } else {
            await tx.insert(salesItems).values({
              ...rest,
              saleId: id,
              id: undefined,
              addBy: item.addBy ? Number(item.addBy) : null,
              editBy: item.editBy ? Number(item.editBy) : null,
            });
          }
        }

        finalItems = await tx
          .select()
          .from(salesItems)
          .where(eq(salesItems.saleId, id));
      }

      return {
        ...formatSaleRow(updatedSale),
        itemLines: finalItems.map(formatSaleItemRow),
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
