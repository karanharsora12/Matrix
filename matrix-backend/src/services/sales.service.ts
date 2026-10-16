import { eq, desc, and, notInArray, count, sql, or, ilike } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db";
import {
  sales,
  salesItems,
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

const addByUser = alias(users, "sales_add_by_user");
const editByUser = alias(users, "sales_edit_by_user");

function toDate(val: any): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

export class SalesService {
  /**
   * Fetch paginated list of Repairing Bills / Sales
   */
  async getSales(options?: {
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    daybookId?: number | undefined;
    daybookGroupId?: number | undefined;
    accountId?: number | undefined;
    fromDate?: string | undefined;
    toDate?: string | undefined;
    fetchAll?: boolean | undefined;
  }) {
    const page = Math.max(1, options?.page || 1);
    const limit = options?.fetchAll
      ? -1
      : Math.min(100, Math.max(1, options?.limit || 50));

    const conditions = [];

    if (options?.daybookId) {
      conditions.push(eq(sales.daybookId, Number(options.daybookId)));
    }

    if (options?.daybookGroupId) {
      conditions.push(
        eq(daybooks.daybookGroupId, Number(options.daybookGroupId)),
      );
    }

    if (options?.accountId) {
      conditions.push(eq(sales.accountId, Number(options.accountId)));
    }

    if (options?.fromDate) {
      const from = new Date(options.fromDate);
      if (!isNaN(from.getTime())) {
        conditions.push(sql`${sales.voucherDate} >= ${from}`);
      }
    }

    if (options?.toDate) {
      const to = new Date(options.toDate);
      if (!isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        conditions.push(sql`${sales.voucherDate} <= ${to}`);
      }
    }

    if (options?.search && options.search.trim() !== "") {
      const q = `%${options.search.trim()}%`;
      const searchCondition = or(
        ilike(sales.voucherNo, q),
        ilike(accounts.accountName, q),
        ilike(accounts.userName, q),
        ilike(sales.salesmanName, q),
        ilike(sales.remarks, q),
        ilike(sales.customerReference, q),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Subquery for line item count per sale
    const itemCountSubquery = db
      .select({
        saleId: salesItems.saleId,
        itemCount: sql<number>`count(${salesItems.id})::int`.as("item_count"),
        totalPcs: sql<number>`coalesce(sum(${salesItems.pcs}), 0)`.as(
          "total_pcs",
        ),
      })
      .from(salesItems)
      .groupBy(salesItems.saleId)
      .as("item_summary");

    // Subquery for settlement payments synced under REPAIRING_BILL
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
        settledAmount:
          sql<string>`coalesce(sum(${payments.totalAmount}), 0)`.as(
            "settled_amount",
          ),
      })
      .from(payments)
      .where(eq(payments.referenceType, "REPAIRING_BILL"))
      .groupBy(payments.referenceId)
      .as("payment_summary");

    let query = db
      .select({
        id: sales.id,
        voucherNo: sales.voucherNo,
        srNo: sales.srNo,
        voucherDate: sales.voucherDate,
        daybookId: sales.daybookId,
        accountId: sales.accountId,
        receiptId: sales.receiptId,
        receiptVoucherNo: orders.voucherNo,
        remarks: sales.remarks,
        salesmanName: sales.salesmanName,
        customerReference: sales.customerReference,
        billMode: sales.billMode,
        subtotal: sales.subtotal,
        discountRate: sales.discountRate,
        discountAmount: sales.discountAmount,
        taxRate: sales.taxRate,
        taxAmount: sales.taxAmount,
        roundOff: sales.roundOff,
        grandTotal: sales.grandTotal,
        advanceAmount: sales.advanceAmount,
        cashAmount: sql<string>`coalesce("payment_summary"."cash_amount", 0)`,
        bankAmount: sql<string>`coalesce("payment_summary"."bank_amount", 0)`,
        dueDate: sales.dueDate,
        deliveryPending: sales.deliveryPending,
        createdAt: sales.createdAt,
        updatedAt: sales.updatedAt,
        daybookName: daybooks.daybookName,
        daybookGroupName: daybookGroups.groupName,
        accountName: accounts.accountName,
        customerPhone: accounts.userName,
        customerEmail: accounts.email,
        addBy: addByUser.name,
        editBy: editByUser.name,
        itemCount: sql<number>`coalesce("item_summary"."item_count", 0)`,
        totalPcs: sql<number>`coalesce("item_summary"."total_pcs", 0)`,
        settledAmount: sql<string>`coalesce("payment_summary"."settled_amount", 0)`,
        balanceAmount: sql<string>`(${sales.grandTotal} - ${sales.advanceAmount} - coalesce("payment_summary"."settled_amount", 0))`,
      })
      .from(sales)
      .leftJoin(daybooks, eq(sales.daybookId, daybooks.id))
      .leftJoin(daybookGroups, eq(daybooks.daybookGroupId, daybookGroups.id))
      .leftJoin(accounts, eq(sales.accountId, accounts.id))
      .leftJoin(orders, eq(sales.receiptId, orders.id))
      .leftJoin(itemCountSubquery, eq(sales.id, itemCountSubquery.saleId))
      .leftJoin(
        paymentSummarySubquery,
        eq(sales.id, paymentSummarySubquery.referenceId),
      )
      .leftJoin(addByUser, eq(sales.addBy, addByUser.id))
      .leftJoin(editByUser, eq(sales.editBy, editByUser.id))
      .where(whereClause)
      .orderBy(desc(sales.id));

    if (!options?.fetchAll && limit !== -1) {
      query = query.limit(limit).offset((page - 1) * limit) as any;
    }

    const countQuery = db
      .select({ total: count() })
      .from(sales)
      .leftJoin(accounts, eq(sales.accountId, accounts.id))
      .where(whereClause);

    const [rows, totalResult] = await Promise.all([query, countQuery]);
    const total = Number(totalResult[0]?.total || 0);

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
    };
  }

  /**
   * Get single Repairing Bill by ID with item lines and linked payments
   */
  async getSaleById(id: number) {
    const [result] = await db
      .select({
        sale: sales,
        account: accounts,
        daybook: daybooks,
        receipt: orders,
      })
      .from(sales)
      .leftJoin(accounts, eq(sales.accountId, accounts.id))
      .leftJoin(daybooks, eq(sales.daybookId, daybooks.id))
      .leftJoin(orders, eq(sales.receiptId, orders.id))
      .where(eq(sales.id, id));

    if (!result) return null;

    const { sale, account, daybook, receipt } = result;

    const fetchedItems = await db
      .select({
        id: salesItems.id,
        saleId: salesItems.saleId,
        receiptItemId: salesItems.receiptItemId,
        itemId: salesItems.itemId,
        itemGroupId: salesItems.itemGroupId,
        tagNo: salesItems.tagNo,
        itemDescription: salesItems.itemDescription,
        itemRemarks: salesItems.itemRemarks,
        pcs: salesItems.pcs,
        uom: salesItems.uom,
        weight: salesItems.weight,
        grossWt: salesItems.grossWt,
        netWt: salesItems.netWt,
        adjustedWt: salesItems.adjustedWt,
        rate: salesItems.rate,
        labourRate: salesItems.labourRate,
        rateTypeId: salesItems.rateTypeId,
        rateType: salesItems.rateType,
        tax: salesItems.tax,
        labourAmount: salesItems.labourAmount,
        otherAmount: salesItems.otherAmount,
        discountAmount: salesItems.discountAmount,
        amount: salesItems.amount,
        deliveryDate: salesItems.deliveryDate,
        itemGroupName: itemGroups.itemGroupName,
        itemName: items.itemName,
        rateTypeName: rateTypes.name,
      })
      .from(salesItems)
      .leftJoin(items, eq(salesItems.itemId, items.id))
      .leftJoin(itemGroups, eq(salesItems.itemGroupId, itemGroups.id))
      .leftJoin(rateTypes, eq(salesItems.rateTypeId, rateTypes.id))
      .where(eq(salesItems.saleId, id))
      .orderBy(salesItems.id);

    // Linked settlement payments
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
          eq(payments.referenceType, "REPAIRING_BILL"),
          eq(payments.referenceId, id),
        ),
      );

    const cashAmount = linkedPayments
      .filter((p) => p.transactionType === "CREC")
      .reduce((total, p) => total + Number(p.totalAmount || 0), 0);
    const bankAmount = linkedPayments
      .filter((p) => p.transactionType === "BREC")
      .reduce((total, p) => total + Number(p.totalAmount || 0), 0);
    const cashPayment = linkedPayments.find((p) => p.transactionType === "CREC");
    const bankPayment = linkedPayments.find((p) => p.transactionType === "BREC");

    const advanceAdjusted = Number(sale.advanceAmount || 0);
    const grandTotalNum = Number(sale.grandTotal || 0);
    const settledAmount = cashAmount + bankAmount;
    const balanceAmount = grandTotalNum - advanceAdjusted - settledAmount;

    return {
      ...sale,
      daybookName: daybook?.daybookName || "",
      accountName: account?.accountName || "",
      customerPhone: account?.userName || "",
      receiptVoucherNo: receipt?.voucherNo || "",
      cashAmount,
      bankAmount,
      cashDaybookId: cashPayment?.daybookId || null,
      bankDaybookId: bankPayment?.daybookId || null,
      cashReference: cashPayment?.accountNo || "",
      bankReference: bankPayment?.accountNo || "",
      advanceAdjusted,
      settledAmount,
      balanceAmount,
      itemLines: fetchedItems.map((line) => ({
        ...line,
        rateType: line.rateTypeName || line.rateType || "",
        pcs: Number(line.pcs ?? 1),
      })),
    };
  }

  /**
   * Fetch eligible unbilled Repairing Receipts (Orders)
   * A receipt is eligible if it has not yet been linked to an active Repairing Bill
   */
  async getEligibleReceipts(options?: {
    excludeSaleId?: number | undefined;
    search?: string | undefined;
    accountId?: number | undefined;
  }) {
    // Collect receipt IDs already billed (excluding current sale if editing)
    const billedQuery = db
      .select({ receiptId: sales.receiptId })
      .from(sales)
      .where(
        options?.excludeSaleId
          ? and(
              sql`${sales.receiptId} IS NOT NULL`,
              sql`${sales.id} != ${options.excludeSaleId}`,
            )
          : sql`${sales.receiptId} IS NOT NULL`,
      );

    const billedRows = await billedQuery;
    const billedReceiptIds = billedRows
      .map((r) => r.receiptId)
      .filter((id): id is number => id != null);

    const conditions = [];

    if (billedReceiptIds.length > 0) {
      conditions.push(notInArray(orders.id, billedReceiptIds));
    }

    if (options?.accountId) {
      conditions.push(eq(orders.accountId, Number(options.accountId)));
    }

    if (options?.search && options.search.trim()) {
      const q = `%${options.search.trim()}%`;
      const searchCondition = or(
        ilike(orders.voucherNo, q),
        ilike(accounts.accountName, q),
        ilike(accounts.userName, q),
        ilike(orders.salesmanName, q),
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get unbilled receipts with customer and line items
    const availableOrders = await db
      .select({
        id: orders.id,
        voucherNo: orders.voucherNo,
        voucherDate: orders.voucherDate,
        accountId: orders.accountId,
        accountName: accounts.accountName,
        customerPhone: accounts.userName,
        salesmanName: orders.salesmanName,
        remarks: orders.remarks,
        subtotal: orders.subtotal,
        grandTotal: orders.grandTotal,
        advanceAmount: orders.advanceAmount,
      })
      .from(orders)
      .leftJoin(accounts, eq(orders.accountId, accounts.id))
      .where(whereClause)
      .orderBy(desc(orders.id))
      .limit(50);

    if (availableOrders.length === 0) return [];

    const orderIds = availableOrders.map((o) => o.id);

    // Fetch items for these orders
    const itemsRows = await db
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
      })
      .from(orderItems)
      .leftJoin(items, eq(orderItems.itemId, items.id))
      .leftJoin(itemGroups, eq(orderItems.itemGroupId, itemGroups.id))
      .where(sql`${orderItems.orderId} IN ${orderIds}`);

    // Fetch actual advance paid from payments table for each receipt
    const paymentsRows = await db
      .select({
        referenceId: payments.referenceId,
        advanceReceived:
          sql<string>`coalesce(sum(${payments.totalAmount}), 0)`.as(
            "advance_received",
          ),
      })
      .from(payments)
      .where(
        and(
          eq(payments.referenceType, "REPAIRING_RECEIPT"),
          sql`${payments.referenceId} IN ${orderIds}`,
        ),
      )
      .groupBy(payments.referenceId);

    const paymentMap = new Map<number, number>();
    for (const p of paymentsRows) {
      if (p.referenceId) {
        paymentMap.set(p.referenceId, Number(p.advanceReceived || 0));
      }
    }

    return availableOrders.map((order) => {
      const lineItems = itemsRows.filter((it) => it.orderId === order.id);
      const advancePaid =
        paymentMap.get(order.id) ?? Number(order.advanceAmount || 0);

      return {
        ...order,
        advancePaid,
        itemCount: lineItems.length,
        itemLines: lineItems.map((l) => ({
          ...l,
          receiptItemId: l.id,
          pcs: Number(l.pcs ?? 1),
          grossWt: Number(l.grossWt ?? 0),
          netWt: Number(l.netWt ?? 0),
          labourRate: Number(l.labourRate ?? 0),
          labourAmount: Number(l.labourAmount ?? 0),
          amount: Number(l.amount ?? 0),
        })),
      };
    });
  }

  /**
   * Create a new Repairing Bill
   */
  async createSale(data: any) {
    return await db.transaction(async (tx) => {
      const { itemLines, ...saleData } = data;

      // Prevent duplicate billing if receiptId is provided
      if (saleData.receiptId) {
        const [existing] = await tx
          .select({ id: sales.id, voucherNo: sales.voucherNo })
          .from(sales)
          .where(eq(sales.receiptId, Number(saleData.receiptId)))
          .limit(1);

        if (existing) {
          throw new Error(
            `Repairing Receipt #${saleData.receiptId} has already been billed under Bill #${existing.voucherNo}`,
          );
        }
      }

      const subtotal = saleData.subtotal ?? 0;
      const grandTotal = saleData.grandTotal ?? subtotal;

      let finalVoucherNo = saleData.voucherNo;
      let finalSrNo = saleData.srNo ? Number(saleData.srNo) : null;

      if (saleData.daybookId && finalVoucherNo) {
        const [existingVoucher] = await tx
          .select({ id: sales.id })
          .from(sales)
          .where(eq(sales.voucherNo, finalVoucherNo))
          .limit(1);

        if (existingVoucher) {
          const freshVoucher = await daybookService.generateVoucherNo({
            daybookId: Number(saleData.daybookId),
            tableName: "sales",
          });
          if (freshVoucher?.voucherNo) {
            finalVoucherNo = freshVoucher.voucherNo;
            finalSrNo = freshVoucher.srNo;
          }
        }
      }

      let resolvedAddBy: number | null = null;
      if (saleData.addBy) {
        const [validUser] = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, Number(saleData.addBy)))
          .limit(1);
        if (validUser) {
          resolvedAddBy = validUser.id;
        }
      }

      const [newSale] = await tx
        .insert(sales)
        .values({
          voucherNo: finalVoucherNo,
          srNo: finalSrNo,
          voucherDate: toDate(saleData.voucherDate) || new Date(),
          daybookId: Number(saleData.daybookId),
          accountId: Number(saleData.accountId),
          receiptId: saleData.receiptId ? Number(saleData.receiptId) : null,
          salesmanName: saleData.salesmanName || null,
          customerReference: saleData.customerReference || saleData.reference || null,
          remarks: saleData.remarks || null,
          billMode: "REPAIRING_BILL",

          subtotal: String(subtotal),
          discountRate: String(saleData.discountRate ?? 0),
          discountAmount: String(saleData.discountAmount ?? 0),
          taxRate: String(saleData.taxRate ?? 0),
          taxAmount: String(saleData.taxAmount ?? 0),
          roundOff: String(saleData.roundOff ?? 0),
          grandTotal: String(grandTotal),

          advanceAmount: String(saleData.advanceAmount ?? saleData.advanceAdjusted ?? 0),
          cashAmount: "0",
          bankAmount: "0",
          cashDaybookId: saleData.cashDaybookId ? Number(saleData.cashDaybookId) : null,
          bankDaybookId: saleData.bankDaybookId ? Number(saleData.bankDaybookId) : null,
          cashReference: saleData.cashReference || null,
          bankReference: saleData.bankReference || null,

          dueDate: toDate(saleData.dueDate),
          deliveryPending: Boolean(saleData.deliveryPending),
          isActive: true,
          addBy: resolvedAddBy,
          editBy: null,
        })
        .returning();

      if (!newSale) {
        throw new Error("Failed to insert repairing bill header");
      }

      let insertedItems: any[] = [];
      if (itemLines && itemLines.length > 0) {
        const itemsToInsert = itemLines.map((item: any) => ({
          saleId: newSale.id,
          receiptItemId: item.receiptItemId ? Number(item.receiptItemId) : null,
          itemId: Number(item.itemId),
          itemGroupId: item.itemGroupId ? Number(item.itemGroupId) : null,
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
          .insert(salesItems)
          .values(itemsToInsert)
          .returning();
      }

      // Synchronize settlement Cash and Bank receipt vouchers in the payments table
      await paymentSyncService.syncTransactionPayments(tx, {
        referenceType: "REPAIRING_BILL",
        referenceId: newSale.id,
        voucherNo: newSale.voucherNo,
        voucherDate: newSale.voucherDate,
        accountId: newSale.accountId,
        cashAmount: saleData.cashAmount,
        bankAmount: saleData.bankAmount,
        cashDaybookId: saleData.cashDaybookId,
        bankDaybookId: saleData.bankDaybookId,
        cashReference: saleData.cashReference,
        bankReference: saleData.bankReference,
        userId: saleData.addBy,
      });

      return {
        ...newSale,
        itemLines: insertedItems,
      };
    });
  }

  /**
   * Update an existing Repairing Bill
   */
  async updateSale(id: number, data: any) {
    return await db.transaction(async (tx) => {
      const { itemLines, ...saleData } = data;

      // Prevent duplicate receipt binding to another bill
      if (saleData.receiptId) {
        const [conflict] = await tx
          .select({ id: sales.id, voucherNo: sales.voucherNo })
          .from(sales)
          .where(
            and(
              eq(sales.receiptId, Number(saleData.receiptId)),
              sql`${sales.id} != ${id}`,
            ),
          )
          .limit(1);

        if (conflict) {
          throw new Error(
            `Repairing Receipt #${saleData.receiptId} is already billed under Bill #${conflict.voucherNo}`,
          );
        }
      }

      const updateValues: any = {
        updatedAt: new Date(),
      };

      if (saleData.accountId !== undefined)
        updateValues.accountId = Number(saleData.accountId);
      if (saleData.voucherNo !== undefined)
        updateValues.voucherNo = saleData.voucherNo;
      if (saleData.srNo !== undefined)
        updateValues.srNo = saleData.srNo ? Number(saleData.srNo) : null;
      if (saleData.daybookId !== undefined)
        updateValues.daybookId = Number(saleData.daybookId);
      if (saleData.receiptId !== undefined)
        updateValues.receiptId = saleData.receiptId
          ? Number(saleData.receiptId)
          : null;
      if (saleData.voucherDate !== undefined)
        updateValues.voucherDate = toDate(saleData.voucherDate) || new Date();
      if (saleData.dueDate !== undefined)
        updateValues.dueDate = toDate(saleData.dueDate);
      if (saleData.remarks !== undefined) updateValues.remarks = saleData.remarks;
      if (saleData.salesmanName !== undefined)
        updateValues.salesmanName = saleData.salesmanName;
      if (saleData.customerReference !== undefined)
        updateValues.customerReference = saleData.customerReference;

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

      if (saleData.advanceAmount !== undefined || saleData.advanceAdjusted !== undefined)
        updateValues.advanceAmount = String(
          saleData.advanceAmount ?? saleData.advanceAdjusted ?? 0,
        );

      if (saleData.deliveryPending !== undefined)
        updateValues.deliveryPending = Boolean(saleData.deliveryPending);
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
          const itemData = {
            receiptItemId: item.receiptItemId ? Number(item.receiptItemId) : null,
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
            updatedAt: new Date(),
          };

          const isExisting =
            item.id &&
            !String(item.id).startsWith("temp-") &&
            !String(item.id).startsWith("line-");

          if (isExisting) {
            const [saved] = await tx
              .update(salesItems)
              .set(itemData)
              .where(
                and(
                  eq(salesItems.id, Number(item.id)),
                  eq(salesItems.saleId, id),
                ),
              )
              .returning();
            finalItems.push(saved);
          } else {
            const [saved] = await tx
              .insert(salesItems)
              .values({
                ...itemData,
                saleId: id,
              })
              .returning();
            finalItems.push(saved);
          }
        }
      }

      // Synchronize settlement payments
      await paymentSyncService.syncTransactionPayments(tx, {
        referenceType: "REPAIRING_BILL",
        referenceId: updatedSale.id,
        voucherNo: updatedSale.voucherNo,
        voucherDate: updatedSale.voucherDate,
        accountId: updatedSale.accountId,
        cashAmount: saleData.cashAmount,
        bankAmount: saleData.bankAmount,
        cashDaybookId: saleData.cashDaybookId,
        bankDaybookId: saleData.bankDaybookId,
        cashReference: saleData.cashReference,
        bankReference: saleData.bankReference,
        userId: saleData.editBy,
      });

      return {
        ...updatedSale,
        itemLines: finalItems,
      };
    });
  }

  /**
   * Delete Repairing Bill and its linked settlement payments
   */
  async deleteSale(id: number) {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: sales.id })
        .from(sales)
        .where(eq(sales.id, id))
        .limit(1);

      if (!existing) return null;

      await paymentSyncService.deleteTransactionPayments(
        tx,
        "REPAIRING_BILL",
        id,
      );
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
