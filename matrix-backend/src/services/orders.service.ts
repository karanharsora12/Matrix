import { eq, desc, and, notInArray, count, sql, or, ilike } from "drizzle-orm";
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
  payments,
} from "../db/schema";
import { paymentSyncService } from "./payment-sync.service";
import { daybookService } from "./daybook.service";
import {
  buildAgGridFilterConditions,
  buildAgGridSort,
} from "../utils/pagination";

const addByUser = alias(users, "orders_add_by_user");
const editByUser = alias(users, "orders_edit_by_user");

function toDate(val: any): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

export class OrdersService {
  /**
   * Fetch paginated list of Repairing Receipts / Orders
   * Includes customer contact, item count, received amount, and balance directly derived in query
   */
  async getOrders(options?: {
    page?: number | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    search?: string | undefined;
    daybookId?: number | undefined;
    daybookGroupId?: number | undefined;
    accountId?: number | undefined;
    fromDate?: string | undefined;
    toDate?: string | undefined;
    fetchAll?: boolean | undefined;
    sortField?: string | undefined;
    sortDirection?: "asc" | "desc" | undefined;
    sortModel?: any[] | undefined;
    filterModel?: Record<string, any> | undefined;
  }) {
    const page = Math.max(1, options?.page || 1);
    const limit = options?.fetchAll
      ? -1
      : Math.min(100, Math.max(1, options?.limit || 50));

    const conditions = [];

    if (options?.daybookId) {
      conditions.push(eq(orders.daybookId, Number(options.daybookId)));
    }

    if (options?.daybookGroupId) {
      conditions.push(
        eq(daybooks.daybookGroupId, Number(options.daybookGroupId)),
      );
    }

    if (options?.accountId) {
      conditions.push(eq(orders.accountId, Number(options.accountId)));
    }

    if (options?.fromDate) {
      const from = new Date(options.fromDate);
      if (!isNaN(from.getTime())) {
        conditions.push(sql`${orders.voucherDate} >= ${from}`);
      }
    }

    if (options?.toDate) {
      const to = new Date(options.toDate);
      if (!isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        conditions.push(sql`${orders.voucherDate} <= ${to}`);
      }
    }

    if (options?.search && options.search.trim() !== "") {
      const q = `%${options.search.trim()}%`;
      const searchCondition = or(
        ilike(orders.voucherNo, q),
        ilike(accounts.accountName, q),
        ilike(accounts.userName, q),
        ilike(orders.salesmanName, q),
        ilike(orders.remarks, q),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const filterableColumns: Record<string, any> = {
      id: orders.id,
      voucherNo: orders.voucherNo,
      voucherDate: orders.voucherDate,
      daybookId: orders.daybookId,
      daybookName: daybooks.daybookName,
      accountId: orders.accountId,
      accountName: accounts.accountName,
      customerName: accounts.accountName,
      customerPhone: accounts.userName,
      customerEmail: accounts.email,
      salesmanName: orders.salesmanName,
      remarks: orders.remarks,
      grandTotal: orders.grandTotal,
      subtotal: orders.subtotal,
      discountAmount: orders.discountAmount,
      taxAmount: orders.taxAmount,
      advanceAmount: orders.advanceAmount,
      receivedAmount: sql`coalesce("payment_summary"."received_amount", 0)`,
      balanceAmount: sql`(${orders.grandTotal} - coalesce("payment_summary"."received_amount", 0))`,
    };

    if (options?.filterModel) {
      const gridFilters = buildAgGridFilterConditions(
        options.filterModel,
        filterableColumns,
      );
      if (gridFilters.length > 0) {
        conditions.push(...gridFilters);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Subquery for line item count per order
    const itemCountSubquery = db
      .select({
        orderId: orderItems.orderId,
        itemCount: sql<number>`count(${orderItems.id})::int`.as("item_count"),
        totalPcs: sql<number>`coalesce(sum(${orderItems.pcs}), 0)`.as(
          "total_pcs",
        ),
      })
      .from(orderItems)
      .groupBy(orderItems.orderId)
      .as("item_summary");

    // Payment vouchers are the source of truth for receipt totals.  Header
    // cash/bank fields are retained for backward compatibility only.
    const paymentSummarySubquery = db
      .select({
        referenceId: payments.referenceId,
        cashAmount:
          sql<string>`coalesce(sum(case when ${payments.transactionType} = 'CREC' then ${payments.totalAmount} else 0 end), 0)`.as(
            "cash_amount",
          ),
        bankAmount:
          sql<string>`coalesce(sum(case when ${payments.transactionType} = 'BREC' then ${payments.totalAmount} else 0 end), 0)`.as(
            "bank_amount",
          ),
        receivedAmount:
          sql<string>`coalesce(sum(${payments.totalAmount}), 0)`.as(
            "received_amount",
          ),
      })
      .from(payments)
      .where(eq(payments.referenceType, "REPAIRING_RECEIPT"))
      .groupBy(payments.referenceId)
      .as("payment_summary");

    let query = db
      .select({
        id: orders.id,
        voucherNo: orders.voucherNo,
        srNo: orders.srNo,
        voucherDate: orders.voucherDate,
        daybookId: orders.daybookId,
        accountId: orders.accountId,
        remarks: orders.remarks,
        salesmanName: orders.salesmanName,
        subtotal: orders.subtotal,
        discountRate: orders.discountRate,
        discountAmount: orders.discountAmount,
        taxRate: orders.taxRate,
        taxAmount: orders.taxAmount,
        roundOff: orders.roundOff,
        grandTotal: orders.grandTotal,
        advanceAmount: orders.advanceAmount,
        cashAmount: sql<string>`coalesce("payment_summary"."cash_amount", 0)`,
        bankAmount: sql<string>`coalesce("payment_summary"."bank_amount", 0)`,
        cardAmount: orders.cardAmount,
        dueDate: orders.dueDate,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        daybookName: daybooks.daybookName,
        daybookGroupName: daybookGroups.groupName,
        accountName: accounts.accountName,
        customerPhone: accounts.userName,
        customerEmail: accounts.email,
        addBy: addByUser.name,
        editBy: editByUser.name,
        itemCount: sql<number>`coalesce("item_summary"."item_count", 0)`,
        totalPcs: sql<number>`coalesce("item_summary"."total_pcs", 0)`,
        receivedAmount: sql<string>`coalesce("payment_summary"."received_amount", 0)`,
        balanceAmount: sql<string>`(${orders.grandTotal} - coalesce("payment_summary"."received_amount", 0))`,
      })
      .from(orders)
      .leftJoin(daybooks, eq(orders.daybookId, daybooks.id))
      .leftJoin(daybookGroups, eq(daybooks.daybookGroupId, daybookGroups.id))
      .leftJoin(accounts, eq(orders.accountId, accounts.id))
      .leftJoin(itemCountSubquery, eq(orders.id, itemCountSubquery.orderId))
      .leftJoin(
        paymentSummarySubquery,
        eq(orders.id, paymentSummarySubquery.referenceId),
      )
      .leftJoin(addByUser, eq(orders.addBy, addByUser.id))
      .leftJoin(editByUser, eq(orders.editBy, editByUser.id))
      .where(whereClause)
      .orderBy(
        buildAgGridSort(
          options?.sortModel,
          options?.sortField,
          options?.sortDirection,
          filterableColumns,
          desc(orders.id),
        ),
      );

    if (!options?.fetchAll && limit !== -1) {
      const offset =
        options?.offset !== undefined && Number.isFinite(options.offset)
          ? Math.max(0, options.offset)
          : (page - 1) * limit;
      query = query.limit(limit).offset(offset) as any;
    }

    const countQuery = db
      .select({
        total: count(),
        grandTotal: sql<string>`coalesce(sum(${orders.grandTotal}), 0)`,
        receivedAmount: sql<string>`coalesce(sum(${paymentSummarySubquery.receivedAmount}), 0)`,
        balanceAmount: sql<string>`coalesce(sum(${orders.grandTotal} - coalesce(${paymentSummarySubquery.receivedAmount}, 0)), 0)`,
      })
      .from(orders)
      .leftJoin(accounts, eq(orders.accountId, accounts.id))
      .leftJoin(
        paymentSummarySubquery,
        eq(orders.id, paymentSummarySubquery.referenceId),
      )
      .where(whereClause);

    const [rows, totalResult] = await Promise.all([query, countQuery]);
    const total = Number(totalResult[0]?.total || 0);
    const grandTotal = Number(totalResult[0]?.grandTotal || 0);
    const receivedAmount = Number(totalResult[0]?.receivedAmount || 0);
    const balanceAmount = Number(totalResult[0]?.balanceAmount || 0);

    return {
      data: rows,
      pagination: {
        page,
        limit: options?.fetchAll || limit === -1 ? total : limit,
        total,
        totalPages: limit === -1 ? 1 : Math.ceil(total / limit) || 1,
        hasNextPage: limit === -1 ? false : page * limit < total,
        hasPrevPage: page > 1,
      },
      summary: [
        {
          voucherNo: `Total: ${total}`,
          grandTotal,
          receivedAmount,
          balanceAmount,
        },
      ],
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
        id: orderItems.id,
        orderId: orderItems.orderId,
        itemId: orderItems.itemId,
        itemGroupId: orderItems.itemGroupId,
        tagNo: orderItems.tagNo,
        itemDescription: orderItems.itemDescription,
        itemRemarks: orderItems.itemRemarks,
        pcs: orderItems.pcs,
        uom: orderItems.uom,
        weight: orderItems.weight,
        grossWt: orderItems.grossWt,
        netWt: orderItems.netWt,
        adjustedWt: orderItems.adjustedWt,
        rate: orderItems.rate,
        labourRate: orderItems.labourRate,
        rateTypeId: orderItems.rateTypeId,
        rateType: orderItems.rateType,
        tax: orderItems.tax,
        labourAmount: orderItems.labourAmount,
        otherAmount: orderItems.otherAmount,
        discountAmount: orderItems.discountAmount,
        amount: orderItems.amount,
        deliveryDate: orderItems.deliveryDate,
        itemGroupName: itemGroups.itemGroupName,
        itemName: items.itemName,
        rateTypeName: rateTypes.name,
      })
      .from(orderItems)
      .leftJoin(items, eq(orderItems.itemId, items.id))
      .leftJoin(itemGroups, eq(orderItems.itemGroupId, itemGroups.id))
      .leftJoin(rateTypes, eq(orderItems.rateTypeId, rateTypes.id))
      .where(eq(orderItems.orderId, id))
      .orderBy(orderItems.id);

    const linkedPayments = await db
      .select({
        transactionType: payments.transactionType,
        totalAmount: payments.totalAmount,
        daybookId: payments.daybookId,
        accountNo: payments.accountNo,
      })
      .from(payments)
      .where(
        and(
          eq(payments.referenceType, "REPAIRING_RECEIPT"),
          eq(payments.referenceId, id),
        ),
      );
    const cashAmount = linkedPayments
      .filter((payment) => payment.transactionType === "CREC")
      .reduce((total, payment) => total + Number(payment.totalAmount || 0), 0);
    const bankAmount = linkedPayments
      .filter((payment) => payment.transactionType === "BREC")
      .reduce((total, payment) => total + Number(payment.totalAmount || 0), 0);
    const receivedAmount = cashAmount + bankAmount;
    const cashPayment = linkedPayments.find(
      (payment) => payment.transactionType === "CREC",
    );
    const bankPayment = linkedPayments.find(
      (payment) => payment.transactionType === "BREC",
    );

    return {
      ...order,
      daybookName: daybook?.daybookName || "",
      accountName: account?.accountName || "",
      customerPhone: account?.userName || "",
      cashAmount,
      bankAmount,
      cashDaybookId: cashPayment?.daybookId || null,
      bankDaybookId: bankPayment?.daybookId || null,
      cashReference: cashPayment?.accountNo || "",
      bankReference: bankPayment?.accountNo || "",
      receivedAmount,
      balanceAmount: Number(order.grandTotal || 0) - receivedAmount,
      itemLines: fetchedItems.map((line) => ({
        ...line,
        rateType: line.rateTypeName || line.rateType || "",
        pcs: Number(line.pcs ?? 1),
      })),
    };
  }

  async createOrder(data: any) {
    return await db.transaction(async (tx) => {
      const { itemLines, ...orderData } = data;

      const subtotal = orderData.subtotal ?? 0;
      const grandTotal = orderData.grandTotal ?? subtotal;

      let finalVoucherNo = orderData.voucherNo;
      let finalSrNo = orderData.srNo ? Number(orderData.srNo) : null;
      if (orderData.daybookId && finalVoucherNo) {
        const [existing] = await tx
          .select({ id: orders.id })
          .from(orders)
          .where(eq(orders.voucherNo, finalVoucherNo))
          .limit(1);
        if (existing) {
          const freshVoucher = await daybookService.generateVoucherNo({
            daybookId: Number(orderData.daybookId),
            tableName: "orders",
          });
          if (freshVoucher?.voucherNo) {
            finalVoucherNo = freshVoucher.voucherNo;
            finalSrNo = freshVoucher.srNo;
          }
        }
      }

      let resolvedAddBy: number | null = null;
      if (orderData.addBy) {
        const [validUser] = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, Number(orderData.addBy)))
          .limit(1);
        if (validUser) {
          resolvedAddBy = validUser.id;
        }
      }

      const [newOrder] = await tx
        .insert(orders)
        .values({
          accountId: orderData.accountId ? Number(orderData.accountId) : null,
          voucherNo: finalVoucherNo,
          srNo: finalSrNo,
          daybookId: orderData.daybookId ? Number(orderData.daybookId) : null,
          voucherDate: toDate(orderData.voucherDate) || new Date(),
          dueDate: toDate(orderData.dueDate),
          remarks: orderData.remarks || null,
          salesmanName: orderData.salesmanName || null,

          subtotal: String(subtotal),
          discountRate: String(orderData.discountRate ?? 0),
          discountAmount: String(orderData.discountAmount ?? 0),
          taxRate: String(orderData.taxRate ?? 0),
          taxAmount: String(orderData.taxAmount ?? 0),
          roundOff: String(orderData.roundOff ?? 0),
          grandTotal: String(grandTotal),

          advanceAmount: String(orderData.advanceAmount ?? 0),
          cashAmount: "0",
          bankAmount: "0",
          cardAmount: String(orderData.cardAmount ?? 0),
          tdsAmount: String(orderData.tdsAmount ?? 0),
          addBy: resolvedAddBy,
          editBy: null,
        })
        .returning();

      if (!newOrder) {
        throw new Error("Failed to insert order header");
      }

      let insertedItems: any[] = [];
      if (itemLines && itemLines.length > 0) {
        const itemsToInsert = itemLines.map((item: any) => ({
          orderId: newOrder.id,
          itemGroupId: item.itemGroupId ? Number(item.itemGroupId) : null,
          itemId: Number(item.itemId),
          tagNo: item.tagNo || item.itemCode || null,
          itemDescription: item.itemDescription || null,
          itemRemarks: item.itemRemarks || null,
          pcs: String(item.pcs ?? item.quantity ?? 1),
          uom: item.uom || null,
          weight: String(item.weight ?? 0),
          grossWt: String(item.grossWt ?? 0),
          netWt: String(item.netWt ?? 0),
          adjustedWt: String(item.adjustedWt ?? 0),
          rate: String(item.rate ?? 0),
          labourRate: String(item.labourRate ?? 0),
          rateTypeId: item.rateTypeId ? Number(item.rateTypeId) : null,
          rateType: item.rateType || null,
          tax: item.tax || null,
          labourAmount: String(item.labourAmount ?? 0),
          otherAmount: String(item.otherAmount ?? 0),
          discountAmount: String(item.discountAmount ?? 0),
          amount: String(item.amount ?? 0),
          deliveryDate: toDate(item.deliveryDate),
        }));

        insertedItems = await tx
          .insert(orderItems)
          .values(itemsToInsert)
          .returning();
      }

      // Synchronize Cash and Bank receipt vouchers in the payments table
      await paymentSyncService.syncTransactionPayments(tx, {
        referenceType: "REPAIRING_RECEIPT",
        referenceId: newOrder.id,
        voucherNo: newOrder.voucherNo,
        voucherDate: newOrder.voucherDate,
        accountId: newOrder.accountId,
        cashAmount: orderData.cashAmount,
        bankAmount: orderData.bankAmount,
        cashDaybookId: orderData.cashDaybookId,
        bankDaybookId: orderData.bankDaybookId,
        cashReference: orderData.cashReference,
        bankReference: orderData.bankReference,
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
      if (orderData.remarks !== undefined)
        updateValues.remarks = orderData.remarks;
      if (orderData.salesmanName !== undefined)
        updateValues.salesmanName = orderData.salesmanName;

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
        updateValues.advanceAmount = String(orderData.advanceAmount ?? 0);
      if (orderData.cardAmount !== undefined)
        updateValues.cardAmount = String(orderData.cardAmount ?? 0);
      if (orderData.editBy !== undefined)
        updateValues.editBy = orderData.editBy
          ? Number(orderData.editBy)
          : null;

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
          const itemData = {
            itemGroupId: item.itemGroupId ? Number(item.itemGroupId) : null,
            itemId: Number(item.itemId),
            tagNo: item.tagNo || item.itemCode || null,
            itemDescription: item.itemDescription || null,
            itemRemarks: item.itemRemarks || null,
            pcs: String(item.pcs ?? item.quantity ?? 1),
            uom: item.uom || null,
            weight: String(item.weight ?? 0),
            grossWt: String(item.grossWt ?? 0),
            netWt: String(item.netWt ?? 0),
            adjustedWt: String(item.adjustedWt ?? 0),
            rate: String(item.rate ?? 0),
            labourRate: String(item.labourRate ?? 0),
            rateTypeId: item.rateTypeId ? Number(item.rateTypeId) : null,
            rateType: item.rateType || null,
            tax: item.tax || null,
            labourAmount: String(item.labourAmount ?? 0),
            otherAmount: String(item.otherAmount ?? 0),
            discountAmount: String(item.discountAmount ?? 0),
            amount: String(item.amount ?? 0),
            deliveryDate: toDate(item.deliveryDate),
          };

          const isExisting =
            item.id &&
            !String(item.id).startsWith("temp-") &&
            !String(item.id).startsWith("line-");

          if (isExisting) {
            const [saved] = await tx
              .update(orderItems)
              .set(itemData)
              .where(
                and(
                  eq(orderItems.id, Number(item.id)),
                  eq(orderItems.orderId, id),
                ),
              )
              .returning();
            finalItems.push(saved);
          } else {
            const [saved] = await tx
              .insert(orderItems)
              .values({
                ...itemData,
                orderId: id,
              })
              .returning();
            finalItems.push(saved);
          }
        }
      }

      await paymentSyncService.syncTransactionPayments(tx, {
        referenceType: "REPAIRING_RECEIPT",
        referenceId: updatedOrder.id,
        voucherNo: updatedOrder.voucherNo,
        voucherDate: updatedOrder.voucherDate,
        accountId: updatedOrder.accountId,
        cashAmount: orderData.cashAmount,
        bankAmount: orderData.bankAmount,
        cashDaybookId: orderData.cashDaybookId,
        bankDaybookId: orderData.bankDaybookId,
        cashReference: orderData.cashReference,
        bankReference: orderData.bankReference,
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
      const [existingOrder] = await tx
        .select({ id: orders.id })
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);
      if (!existingOrder) return null;

      await paymentSyncService.deleteTransactionPayments(
        tx,
        "REPAIRING_RECEIPT",
        id,
      );
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
