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
  rateTypes,
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

async function resolveRateTypeId(item: any, tx?: any): Promise<number | null> {
  if (item.rateTypeId != null && item.rateTypeId !== "") {
    return Number(item.rateTypeId);
  }
  if (item.rateType) {
    const database = tx || db;
    const found = await database.query.rateTypes.findFirst({
      where: eq(rateTypes.name, item.rateType),
    });
    if (found) return found.id;
  }
  return null;
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
        ...sale,
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
        rateTypeName: rateTypes.name,
      })
      .from(salesItems)
      .leftJoin(itemGroups, eq(salesItems.itemGroupId, itemGroups.id))
      .leftJoin(items, eq(salesItems.itemId, items.id))
      .leftJoin(rateTypes, eq(salesItems.rateTypeId, rateTypes.id))
      .where(eq(salesItems.saleId, id));

    return {
      ...sale,
      daybookName: daybook?.daybookName || "",
      accountId: sale.accountId,
      accountName: account?.accountName || "",
      customerPhone: account?.userName || "",
      itemLines: fetchedItems.map(
        ({ item, itemGroupName, itemName, rateTypeName }) => ({
          ...item,
          itemGroupName,
          itemName,
          rateType: rateTypeName || item.rateType || "",
          pcs: Number(item.pcs ?? 1),
        }),
      ),
    };
  }

  async createSale(data: any) {
    return await db.transaction(async (tx) => {
      const { itemLines, ...saleData } = data;

      const subtotal = saleData.subtotal ?? 0;
      const grandTotal = saleData.grandTotal ?? 0;

      const [newSale] = await tx
        .insert(sales)
        .values({
          accountId: saleData.accountId ? Number(saleData.accountId) : null,
          voucherNo: saleData.voucherNo,
          srNo: saleData.srNo ? Number(saleData.srNo) : null,
          daybookId: saleData.daybookId ? Number(saleData.daybookId) : null,
          voucherDate: toDate(saleData.voucherDate) || new Date(),
          dueDate: toDate(saleData.dueDate),
          reference: saleData.reference || null,
          remarks: saleData.remarks || null,
          salesmanName: saleData.salesmanName || null,
          billMode: saleData.billMode || null,

          subtotal: String(subtotal),
          discountRate: String(saleData.discountRate ?? 0),
          discountAmount: String(saleData.discountAmount ?? 0),
          taxRate: String(saleData.taxRate ?? 0),
          taxAmount: String(saleData.taxAmount ?? 0),
          roundOff: String(saleData.roundOff ?? 0),
          grandTotal: String(grandTotal),

          advanceAmount: String(saleData.advanceAmount ?? 0),
          urdAmount: String(saleData.urdAmount ?? 0),
          cashAmount: String(saleData.cashAmount ?? 0),
          bankAmount: String(saleData.bankAmount ?? 0),
          cardAmount: String(saleData.cardAmount ?? 0),
          cardCommission: String(saleData.cardCommission ?? 0),
          schemeAmount: String(saleData.schemeAmount ?? 0),
          giftVoucherAmount: String(saleData.giftVoucherAmount ?? 0),
          salesReturnAmount: String(saleData.salesReturnAmount ?? 0),
          kasarAmount: String(saleData.kasarAmount ?? 0),
          tdsAmount: String(saleData.tdsAmount ?? 0),

          rateFixType: saleData.rateFixType || null,
          deliveryPending: Boolean(saleData.deliveryPending),
          isActive: saleData.isActive ?? true,

          addBy: saleData.addBy ? Number(saleData.addBy) : null,
          editBy: saleData.editBy ? Number(saleData.editBy) : null,
        })
        .returning();

      if (!newSale) {
        throw new Error("Failed to create sale voucher");
      }

      let insertedItems: any[] = [];
      if (itemLines && itemLines.length > 0) {
        const itemsToInsert = await Promise.all(
          itemLines.map(async (item: any) => {
            const pcs = item.pcs ?? item.qty ?? 1;
            const amount = item.amount ?? 0;
            const rateTypeId = await resolveRateTypeId(item, tx);

            return {
              saleId: newSale.id,
              itemGroupId: item.itemGroupId ? Number(item.itemGroupId) : null,
              itemId: Number(item.itemId),
              tagNo: item.tagNo || item.itemCode || null,
              pcs: String(pcs),
              uom: item.uom || null,
              weight: String(item.weight ?? 0),
              grossWt: String(item.grossWt ?? 0),
              netWt: String(item.netWt ?? 0),
              adjustedWt: String(item.adjustedWt ?? 0),
              rate: String(item.rate ?? 0),
              rateTypeId: rateTypeId,
              rateType: item.rateType || null,
              tax: item.tax || null,
              labourAmount: String(item.labourAmount ?? 0),
              otherAmount: String(item.otherAmount ?? 0),
              discountAmount: String(item.discountAmount ?? 0),
              amount: String(amount),
              addBy: item.addBy ? Number(item.addBy) : null,
              editBy: item.editBy ? Number(item.editBy) : null,
            };
          }),
        );

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

      const updateValues: any = {
        updatedAt: new Date(),
      };

      if (saleData.accountId !== undefined)
        updateValues.accountId = saleData.accountId
          ? Number(saleData.accountId)
          : null;
      if (saleData.voucherNo !== undefined)
        updateValues.voucherNo = saleData.voucherNo;
      if (saleData.srNo !== undefined)
        updateValues.srNo = saleData.srNo ? Number(saleData.srNo) : null;
      if (saleData.daybookId !== undefined)
        updateValues.daybookId = saleData.daybookId
          ? Number(saleData.daybookId)
          : null;
      if (saleData.voucherDate !== undefined)
        updateValues.voucherDate = toDate(saleData.voucherDate) || new Date();
      if (saleData.dueDate !== undefined)
        updateValues.dueDate = toDate(saleData.dueDate);
      if (saleData.reference !== undefined)
        updateValues.reference = saleData.reference;
      if (saleData.remarks !== undefined)
        updateValues.remarks = saleData.remarks;
      if (saleData.salesmanName !== undefined)
        updateValues.salesmanName = saleData.salesmanName;
      if (saleData.billMode !== undefined)
        updateValues.billMode = saleData.billMode;

      if (saleData.subtotal !== undefined)
        updateValues.subtotal = String(saleData.subtotal ?? 0);
      if (saleData.discountRate !== undefined)
        updateValues.discountRate = String(saleData.discountRate ?? 0);
      if (saleData.discountAmount !== undefined)
        updateValues.discountAmount = String(saleData.discountAmount ?? 0);
      if (saleData.taxRate !== undefined)
        updateValues.taxRate = String(saleData.taxRate ?? 0);
      if (saleData.taxAmount !== undefined)
        updateValues.taxAmount = String(saleData.taxAmount ?? 0);
      if (saleData.roundOff !== undefined)
        updateValues.roundOff = String(saleData.roundOff ?? 0);
      if (saleData.grandTotal !== undefined)
        updateValues.grandTotal = String(saleData.grandTotal ?? 0);

      if (saleData.advanceAmount !== undefined)
        updateValues.advanceAmount = String(saleData.advanceAmount);
      if (saleData.urdAmount !== undefined)
        updateValues.urdAmount = String(saleData.urdAmount);
      if (saleData.cashAmount !== undefined)
        updateValues.cashAmount = String(saleData.cashAmount);
      if (saleData.bankAmount !== undefined)
        updateValues.bankAmount = String(saleData.bankAmount);
      if (saleData.cardAmount !== undefined)
        updateValues.cardAmount = String(saleData.cardAmount);
      if (saleData.cardCommission !== undefined)
        updateValues.cardCommission = String(saleData.cardCommission);
      if (saleData.schemeAmount !== undefined)
        updateValues.schemeAmount = String(saleData.schemeAmount);
      if (saleData.giftVoucherAmount !== undefined)
        updateValues.giftVoucherAmount = String(saleData.giftVoucherAmount);
      if (saleData.salesReturnAmount !== undefined)
        updateValues.salesReturnAmount = String(saleData.salesReturnAmount);
      if (saleData.kasarAmount !== undefined)
        updateValues.kasarAmount = String(saleData.kasarAmount);
      if (saleData.tdsAmount !== undefined)
        updateValues.tdsAmount = String(saleData.tdsAmount);

      if (saleData.rateFixType !== undefined)
        updateValues.rateFixType = saleData.rateFixType;
      if (saleData.deliveryPending !== undefined)
        updateValues.deliveryPending = Boolean(saleData.deliveryPending);
      if (saleData.isActive !== undefined)
        updateValues.isActive = saleData.isActive;
      if (saleData.editBy !== undefined)
        updateValues.editBy = saleData.editBy ? Number(saleData.editBy) : null;

      const [updatedSale] = await tx
        .update(sales)
        .set(updateValues)
        .where(eq(sales.id, id))
        .returning();

      if (!updatedSale) {
        return null;
      }

      let finalItems: any[] = [];
      if (itemLines) {
        const idsToKeep = itemLines
          .map((i: any) => i.id)
          .filter(
            (itemId: any) =>
              itemId != null &&
              !String(itemId).startsWith("temp-") &&
              !String(itemId).startsWith("line-"),
          );

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
          const pcs = item.pcs ?? item.qty ?? 1;
          const amount = item.amount ?? 0;
          const rateTypeId = await resolveRateTypeId(item, tx);

          const itemData = {
            itemGroupId: item.itemGroupId ? Number(item.itemGroupId) : null,
            itemId: Number(item.itemId),
            tagNo: item.tagNo || item.itemCode || null,
            pcs: String(pcs),
            uom: item.uom || null,
            weight: String(item.weight ?? 0),
            grossWt: String(item.grossWt ?? 0),
            netWt: String(item.netWt ?? 0),
            adjustedWt: String(item.adjustedWt ?? 0),
            rate: String(item.rate ?? 0),
            rateTypeId: rateTypeId,
            rateType: item.rateType || null,
            tax: item.tax || null,
            labourAmount: String(item.labourAmount ?? 0),
            otherAmount: String(item.otherAmount ?? 0),
            discountAmount: String(item.discountAmount ?? 0),
            amount: String(amount),
            editBy: item.editBy ? Number(item.editBy) : null,
          };

          const isExisting =
            item.id &&
            !String(item.id).startsWith("temp-") &&
            !String(item.id).startsWith("line-");

          if (isExisting) {
            const [saved] = await tx
              .update(salesItems)
              .set(itemData)
              .where(eq(salesItems.id, Number(item.id)))
              .returning();
            finalItems.push(saved);
          } else {
            const [saved] = await tx
              .insert(salesItems)
              .values({
                ...itemData,
                saleId: id,
                addBy: item.addBy ? Number(item.addBy) : null,
              })
              .returning();
            finalItems.push(saved);
          }
        }
      }

      return {
        ...updatedSale,
        itemLines: finalItems,
      };
    });
  }

  async deleteSale(id: number) {
    return await db.transaction(async (tx) => {
      await tx.delete(salesItems).where(eq(salesItems.saleId, id));
      const [deleted] = await tx
        .delete(sales)
        .where(eq(sales.id, id))
        .returning();
      return deleted;
    });
  }
}

export const salesService = new SalesService();
