import { eq, desc, and, notInArray, count } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db";
import {
  purchases,
  purchaseItems,
  daybooks,
  daybookGroups,
  accounts,
  itemGroups,
  items,
  rateTypes,
  users,
} from "../db/schema";

const addByUser = alias(users, "purchases_add_by_user");
const editByUser = alias(users, "purchases_edit_by_user");

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

export class PurchaseService {
  async getPurchases(options?: {
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
        purchase: purchases,
        daybook: daybooks,
        daybookGroup: daybookGroups,
        account: accounts,
        addByUserName: addByUser.name,
        editByUserName: editByUser.name,
      })
      .from(purchases)
      .leftJoin(daybooks, eq(purchases.daybookId, daybooks.id))
      .leftJoin(daybookGroups, eq(daybooks.daybookGroupId, daybookGroups.id))
      .leftJoin(accounts, eq(purchases.accountId, accounts.id))
      .leftJoin(addByUser, eq(purchases.addBy, addByUser.id))
      .leftJoin(editByUser, eq(purchases.editBy, editByUser.id))
      .orderBy(desc(purchases.createdAt));

    if (!options?.fetchAll && limit !== -1) {
      query = query.limit(limit).offset((page - 1) * limit) as any;
    }

    const [rows, totalResult] = await Promise.all([
      query,
      db.select({ total: count() }).from(purchases),
    ]);
    const total = Number(totalResult[0]?.total || 0);

    const data = rows.map(
      ({
        purchase,
        daybook,
        daybookGroup,
        account,
        addByUserName,
        editByUserName,
      }) => ({
        ...purchase,
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

  async getPurchaseById(id: number) {
    const [result] = await db
      .select({
        purchase: purchases,
        account: accounts,
        daybook: daybooks,
      })
      .from(purchases)
      .leftJoin(accounts, eq(purchases.accountId, accounts.id))
      .leftJoin(daybooks, eq(purchases.daybookId, daybooks.id))
      .where(eq(purchases.id, id));

    if (!result) return null;

    const { purchase, account, daybook } = result;

    const fetchedItems = await db
      .select({
        item: purchaseItems,
        itemGroupName: itemGroups.itemGroupName,
        itemName: items.itemName,
        rateTypeName: rateTypes.name,
      })
      .from(purchaseItems)
      .leftJoin(itemGroups, eq(purchaseItems.itemGroupId, itemGroups.id))
      .leftJoin(items, eq(purchaseItems.itemId, items.id))
      .leftJoin(rateTypes, eq(purchaseItems.rateTypeId, rateTypes.id))
      .where(eq(purchaseItems.purchaseId, id));

    return {
      ...purchase,
      daybookName: daybook?.daybookName || "",
      accountId: purchase.accountId,
      accountName: account?.accountName || "",
      supplierPhone: account?.userName || "",
      itemLines: fetchedItems.map(({ item, itemGroupName, itemName, rateTypeName }) => ({
        ...item,
        itemGroupName,
        itemName,
        rateType: rateTypeName || "",
        pcs: Number(item.qty),
      })),
    };
  }

  async createPurchase(data: any) {
    return await db.transaction(async (tx) => {
      const { itemLines, ...purchaseData } = data;

      const totalTaxable =
        purchaseData.totalTaxableAmount ??
        purchaseData.subtotal ??
        0;
      const totalAmt =
        purchaseData.totalAmount ??
        purchaseData.grandTotal ??
        0;

      const [newPurchase] = await tx
        .insert(purchases)
        .values({
          accountId: purchaseData.accountId ? Number(purchaseData.accountId) : null,
          voucherNo: purchaseData.voucherNo,
          srNo: purchaseData.srNo ? Number(purchaseData.srNo) : null,
          daybookId: purchaseData.daybookId ? Number(purchaseData.daybookId) : null,
          voucherDate: toDate(purchaseData.voucherDate) || new Date(),
          reference: purchaseData.reference || null,
          remarks: purchaseData.remarks || null,
          totalTaxableAmount: String(totalTaxable),
          totalAmount: String(totalAmt),
          osAmount: String(purchaseData.osAmount ?? 0),
          advanceAmount: String(purchaseData.advanceAmount ?? 0),
          addBy: purchaseData.addBy ? Number(purchaseData.addBy) : null,
          editBy: purchaseData.editBy ? Number(purchaseData.editBy) : null,
        })
        .returning();

      if (!newPurchase) {
        throw new Error("Failed to create purchase voucher");
      }

      let insertedItems: any[] = [];
      if (itemLines && itemLines.length > 0) {
        const itemsToInsert = await Promise.all(
          itemLines.map(async (item: any) => {
            const qty = item.qty ?? item.pcs ?? 1;
            const amount = item.amount ?? 0;
            const taxableAmount = item.taxableAmount ?? amount;
            const amountWithTax = item.amountWithTax ?? amount;
            const rateTypeId = await resolveRateTypeId(item, tx);

            return {
              purchaseId: newPurchase.id,
              itemGroupId: item.itemGroupId ? Number(item.itemGroupId) : null,
              itemId: Number(item.itemId),
              itemCode: item.itemCode || item.tagNo || null,
              qty: String(qty),
              uom: item.uom || null,
              rate: String(item.rate ?? 0),
              rateTypeId: rateTypeId,
              grossWt: String(item.grossWt ?? 0),
              netWt: String(item.netWt ?? 0),
              amount: String(amount),
              taxableAmount: String(taxableAmount),
              amountWithTax: String(amountWithTax),
              discountAmount: String(item.discountAmount ?? 0),
            };
          }),
        );

        insertedItems = await tx
          .insert(purchaseItems)
          .values(itemsToInsert)
          .returning();
      }

      return {
        ...newPurchase,
        itemLines: insertedItems,
      };
    });
  }

  async updatePurchase(id: number, data: any) {
    return await db.transaction(async (tx) => {
      const { itemLines, ...purchaseData } = data;

      const updateValues: any = {
        updatedAt: new Date(),
      };

      if (purchaseData.accountId !== undefined)
        updateValues.accountId = purchaseData.accountId ? Number(purchaseData.accountId) : null;
      if (purchaseData.voucherNo !== undefined)
        updateValues.voucherNo = purchaseData.voucherNo;
      if (purchaseData.srNo !== undefined)
        updateValues.srNo = purchaseData.srNo ? Number(purchaseData.srNo) : null;
      if (purchaseData.daybookId !== undefined)
        updateValues.daybookId = purchaseData.daybookId ? Number(purchaseData.daybookId) : null;
      if (purchaseData.voucherDate !== undefined)
        updateValues.voucherDate = toDate(purchaseData.voucherDate) || new Date();
      if (purchaseData.reference !== undefined)
        updateValues.reference = purchaseData.reference;
      if (purchaseData.remarks !== undefined)
        updateValues.remarks = purchaseData.remarks;
      if (purchaseData.totalTaxableAmount !== undefined || purchaseData.subtotal !== undefined)
        updateValues.totalTaxableAmount = String(purchaseData.totalTaxableAmount ?? purchaseData.subtotal ?? 0);
      if (purchaseData.totalAmount !== undefined || purchaseData.grandTotal !== undefined)
        updateValues.totalAmount = String(purchaseData.totalAmount ?? purchaseData.grandTotal ?? 0);
      if (purchaseData.osAmount !== undefined)
        updateValues.osAmount = String(purchaseData.osAmount);
      if (purchaseData.advanceAmount !== undefined)
        updateValues.advanceAmount = String(purchaseData.advanceAmount);
      if (purchaseData.editBy !== undefined)
        updateValues.editBy = purchaseData.editBy ? Number(purchaseData.editBy) : null;

      const [updatedPurchase] = await tx
        .update(purchases)
        .set(updateValues)
        .where(eq(purchases.id, id))
        .returning();

      if (!updatedPurchase) {
        return null;
      }

      let finalItems: any[] = [];
      if (itemLines) {
        const idsToKeep = itemLines
          .map((i: any) => i.id)
          .filter((itemId: any) => itemId != null && !String(itemId).startsWith("temp-") && !String(itemId).startsWith("line-"));

        if (idsToKeep.length > 0) {
          await tx
            .delete(purchaseItems)
            .where(
              and(
                eq(purchaseItems.purchaseId, id),
                notInArray(purchaseItems.id, idsToKeep),
              ),
            );
        } else {
          await tx
            .delete(purchaseItems)
            .where(eq(purchaseItems.purchaseId, id));
        }

        for (const item of itemLines) {
          const qty = item.qty ?? item.pcs ?? 1;
          const amount = item.amount ?? 0;
          const taxableAmount = item.taxableAmount ?? amount;
          const amountWithTax = item.amountWithTax ?? amount;
          const rateTypeId = await resolveRateTypeId(item, tx);

          const itemData = {
            itemGroupId: item.itemGroupId ? Number(item.itemGroupId) : null,
            itemId: Number(item.itemId),
            itemCode: item.itemCode || item.tagNo || null,
            qty: String(qty),
            uom: item.uom || null,
            rate: String(item.rate ?? 0),
            rateTypeId: rateTypeId,
            grossWt: String(item.grossWt ?? 0),
            netWt: String(item.netWt ?? 0),
            amount: String(amount),
            taxableAmount: String(taxableAmount),
            amountWithTax: String(amountWithTax),
            discountAmount: String(item.discountAmount ?? 0),
          };

          const isExisting = item.id && !String(item.id).startsWith("temp-") && !String(item.id).startsWith("line-");

          if (isExisting) {
            const [saved] = await tx
              .update(purchaseItems)
              .set(itemData)
              .where(eq(purchaseItems.id, Number(item.id)))
              .returning();
            finalItems.push(saved);
          } else {
            const [saved] = await tx
              .insert(purchaseItems)
              .values({
                ...itemData,
                purchaseId: id,
              })
              .returning();
            finalItems.push(saved);
          }
        }
      }

      return {
        ...updatedPurchase,
        itemLines: finalItems,
      };
    });
  }

  async deletePurchase(id: number) {
    return await db.transaction(async (tx) => {
      await tx.delete(purchaseItems).where(eq(purchaseItems.purchaseId, id));
      const [deleted] = await tx
        .delete(purchases)
        .where(eq(purchases.id, id))
        .returning();
      return deleted;
    });
  }
}

export const purchaseService = new PurchaseService();

