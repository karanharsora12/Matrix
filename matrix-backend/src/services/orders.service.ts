import { eq, desc, and, notInArray, count } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db";
import {
  orders,
  orderItems,
  daybooks,
  daybookGroups,
  accounts,
  itemGroups,
  items,
  rateTypes,
  users,
} from "../db/schema";
import { paymentSyncService } from "./payment-sync.service";

const addByUser = alias(users, "orders_add_by_user");
const editByUser = alias(users, "orders_edit_by_user");

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

export class OrdersService {
  async getOrders(options?: {
    page?: number | undefined;
    limit?: number | undefined;
    fetchAll?: boolean | undefined;
  }) {
    const page = Math.max(1, options?.page || 1);
    const limit = options?.fetchAll
      ? -1
      : Math.min(100, Math.max(1, options?.limit || 50));

    let query = db
      .select({
        order: orders,
        daybook: daybooks,
        daybookGroup: daybookGroups,
        account: accounts,
        addByUserName: addByUser.name,
        editByUserName: editByUser.name,
      })
      .from(orders)
      .leftJoin(daybooks, eq(orders.daybookId, daybooks.id))
      .leftJoin(daybookGroups, eq(daybooks.daybookGroupId, daybookGroups.id))
      .leftJoin(accounts, eq(orders.accountId, accounts.id))
      .leftJoin(addByUser, eq(orders.addBy, addByUser.id))
      .leftJoin(editByUser, eq(orders.editBy, editByUser.id))
      .orderBy(desc(orders.createdAt));

    if (!options?.fetchAll && limit !== -1) {
      query = query.limit(limit).offset((page - 1) * limit) as any;
    }

    const [rows, totalResult] = await Promise.all([
      query,
      db.select({ total: count() }).from(orders),
    ]);
    const total = Number(totalResult[0]?.total || 0);

    const data = rows.map(
      ({
        order,
        daybook,
        daybookGroup,
        account,
        addByUserName,
        editByUserName,
      }) => ({
        ...order,
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

  async getOrderById(id: number) {
    const [result] = await db
      .select({
        order: orders,
        account: accounts,
        daybook: daybooks,
      })
      .from(orders)
      .leftJoin(accounts, eq(orders.accountId, accounts.id))
      .leftJoin(daybooks, eq(orders.daybookId, daybooks.id))
      .where(eq(orders.id, id));

    if (!result) return null;

    const { order, account, daybook } = result;

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
      .where(eq(orderItems.orderId, id));

    return {
      ...order,
      daybookName: daybook?.daybookName || "",
      accountId: order.accountId,
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

  async createOrder(data: any) {
    return await db.transaction(async (tx) => {
      const { itemLines, ...orderData } = data;

      const subtotal = orderData.subtotal ?? 0;
      const grandTotal = orderData.grandTotal ?? 0;

      const [newOrder] = await tx
        .insert(orders)
        .values({
          accountId: orderData.accountId ? Number(orderData.accountId) : null,
          voucherNo: orderData.voucherNo,
          srNo: orderData.srNo ? Number(orderData.srNo) : null,
          daybookId: orderData.daybookId ? Number(orderData.daybookId) : null,
          voucherDate: toDate(orderData.voucherDate) || new Date(),
          dueDate: toDate(orderData.dueDate),
          reference: orderData.reference || null,
          remarks: orderData.remarks || null,
          salesmanName: orderData.salesmanName || null,
          billMode: orderData.billMode || null,

          subtotal: String(subtotal),
          discountRate: String(orderData.discountRate ?? 0),
          discountAmount: String(orderData.discountAmount ?? 0),
          taxRate: String(orderData.taxRate ?? 0),
          taxAmount: String(orderData.taxAmount ?? 0),
          roundOff: String(orderData.roundOff ?? 0),
          grandTotal: String(grandTotal),

          advanceAmount: String(orderData.advanceAmount ?? 0),
          cashAmount: String(orderData.cashAmount ?? 0),
          bankAmount: String(orderData.bankAmount ?? 0),
          cardAmount: String(orderData.cardAmount ?? 0),
          cardCommission: String(orderData.cardCommission ?? 0),
          schemeAmount: String(orderData.schemeAmount ?? 0),
          giftVoucherAmount: String(orderData.giftVoucherAmount ?? 0),
          salesReturnAmount: String(orderData.salesReturnAmount ?? 0),
          tdsAmount: String(orderData.tdsAmount ?? 0),
          deliveryPending: Boolean(orderData.deliveryPending),

          addBy: orderData.addBy ? Number(orderData.addBy) : null,
          editBy: orderData.editBy ? Number(orderData.editBy) : null,
        })
        .returning();

      if (!newOrder) {
        throw new Error("Failed to create order voucher");
      }

      let insertedItems: any[] = [];
      if (itemLines && itemLines.length > 0) {
        const itemsToInsert = await Promise.all(
          itemLines.map(async (item: any) => {
            const pcs = item.pcs ?? item.qty ?? 1;
            const amount = item.amount ?? 0;
            const rateTypeId = await resolveRateTypeId(item, tx);

            return {
              orderId: newOrder.id,
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
          .insert(orderItems)
          .values(itemsToInsert)
          .returning();
      }

      await paymentSyncService.syncTransactionPayments(tx, {
        referenceType: "ORDERS",
        referenceId: newOrder.id,
        voucherNo: newOrder.voucherNo,
        voucherDate: newOrder.voucherDate,
        accountId: newOrder.accountId,
        cashAmount: orderData.cashAmount,
        bankAmount: orderData.bankAmount,
        userId: orderData.addBy,
      });

      return {
        ...newOrder,
        itemLines: insertedItems,
      };
    });
  }

  async updateOrder(id: number, data: any) {
    return await db.transaction(async (tx) => {
      const { itemLines, ...orderData } = data;

      const updateValues: any = {
        updatedAt: new Date(),
      };

      if (orderData.accountId !== undefined)
        updateValues.accountId = orderData.accountId
          ? Number(orderData.accountId)
          : null;
      if (orderData.voucherNo !== undefined)
        updateValues.voucherNo = orderData.voucherNo;
      if (orderData.srNo !== undefined)
        updateValues.srNo = orderData.srNo ? Number(orderData.srNo) : null;
      if (orderData.daybookId !== undefined)
        updateValues.daybookId = orderData.daybookId
          ? Number(orderData.daybookId)
          : null;
      if (orderData.voucherDate !== undefined)
        updateValues.voucherDate = toDate(orderData.voucherDate) || new Date();
      if (orderData.dueDate !== undefined)
        updateValues.dueDate = toDate(orderData.dueDate);
      if (orderData.reference !== undefined)
        updateValues.reference = orderData.reference;
      if (orderData.remarks !== undefined)
        updateValues.remarks = orderData.remarks;
      if (orderData.salesmanName !== undefined)
        updateValues.salesmanName = orderData.salesmanName;
      if (orderData.billMode !== undefined)
        updateValues.billMode = orderData.billMode;

      if (orderData.subtotal !== undefined)
        updateValues.subtotal = String(orderData.subtotal ?? 0);
      if (orderData.discountRate !== undefined)
        updateValues.discountRate = String(orderData.discountRate ?? 0);
      if (orderData.discountAmount !== undefined)
        updateValues.discountAmount = String(orderData.discountAmount ?? 0);
      if (orderData.taxRate !== undefined)
        updateValues.taxRate = String(orderData.taxRate ?? 0);
      if (orderData.taxAmount !== undefined)
        updateValues.taxAmount = String(orderData.taxAmount ?? 0);
      if (orderData.roundOff !== undefined)
        updateValues.roundOff = String(orderData.roundOff ?? 0);
      if (orderData.grandTotal !== undefined)
        updateValues.grandTotal = String(orderData.grandTotal ?? 0);

      if (orderData.advanceAmount !== undefined)
        updateValues.advanceAmount = String(orderData.advanceAmount);
      if (orderData.cashAmount !== undefined)
        updateValues.cashAmount = String(orderData.cashAmount);
      if (orderData.bankAmount !== undefined)
        updateValues.bankAmount = String(orderData.bankAmount);
      if (orderData.cardAmount !== undefined)
        updateValues.cardAmount = String(orderData.cardAmount);
      if (orderData.cardCommission !== undefined)
        updateValues.cardCommission = String(orderData.cardCommission);
      if (orderData.schemeAmount !== undefined)
        updateValues.schemeAmount = String(orderData.schemeAmount);
      if (orderData.giftVoucherAmount !== undefined)
        updateValues.giftVoucherAmount = String(orderData.giftVoucherAmount);
      if (orderData.salesReturnAmount !== undefined)
        updateValues.salesReturnAmount = String(orderData.salesReturnAmount);
      if (orderData.tdsAmount !== undefined)
        updateValues.tdsAmount = String(orderData.tdsAmount);
      if (orderData.deliveryPending !== undefined)
        updateValues.deliveryPending = Boolean(orderData.deliveryPending);
      if (orderData.isActive !== undefined)
        updateValues.isActive = orderData.isActive;
      if (orderData.editBy !== undefined)
        updateValues.editBy = orderData.editBy ? Number(orderData.editBy) : null;

      const [updatedOrder] = await tx
        .update(orders)
        .set(updateValues)
        .where(eq(orders.id, id))
        .returning();

      if (!updatedOrder) {
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
            .delete(orderItems)
            .where(
              and(
                eq(orderItems.orderId, id),
                notInArray(orderItems.id, idsToKeep),
              ),
            );
        } else {
          await tx.delete(orderItems).where(eq(orderItems.orderId, id));
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
              .update(orderItems)
              .set(itemData)
              .where(eq(orderItems.id, Number(item.id)))
              .returning();
            finalItems.push(saved);
          } else {
            const [saved] = await tx
              .insert(orderItems)
              .values({
                ...itemData,
                orderId: id,
                addBy: item.addBy ? Number(item.addBy) : null,
              })
              .returning();
            finalItems.push(saved);
          }
        }
      }

      await paymentSyncService.syncTransactionPayments(tx, {
        referenceType: "ORDERS",
        referenceId: updatedOrder.id,
        voucherNo: updatedOrder.voucherNo,
        voucherDate: updatedOrder.voucherDate,
        accountId: updatedOrder.accountId,
        cashAmount: updatedOrder.cashAmount,
        bankAmount: updatedOrder.bankAmount,
        userId: orderData.editBy,
      });

      return {
        ...updatedOrder,
        itemLines: finalItems,
      };
    });
  }

  async deleteOrder(id: number) {
    return await db.transaction(async (tx) => {
      await paymentSyncService.deleteTransactionPayments(tx, "ORDERS", id);
      await tx.delete(orderItems).where(eq(orderItems.orderId, id));
      const [deleted] = await tx
        .delete(orders)
        .where(eq(orders.id, id))
        .returning();
      return deleted;
    });
  }
}

export const ordersService = new OrdersService();
