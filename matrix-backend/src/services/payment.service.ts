import { eq, desc, and, notInArray, count, or, ilike, sql } from "drizzle-orm";
import { db } from "../db";
import {
  payments,
  paymentDetails,
  daybooks,
  daybookGroups,
  accounts,
} from "../db/schema";

export class PaymentService {
  async getPayments(options?: {
    page?: number;
    limit?: number;
    fetchAll?: boolean;
    transactionType?: string;
    search?: string;
  }) {
    const page = Math.max(1, options?.page || 1);
    const limit = options?.fetchAll
      ? -1
      : Math.min(100, Math.max(1, options?.limit || 50));

    let conditions: any[] = [];

    if (options?.transactionType) {
      conditions.push(eq(payments.transactionType, options.transactionType));
    }

    if (options?.search) {
      const s = `%${options.search}%`;
      conditions.push(
        or(
          ilike(payments.voucherNo, s),
          ilike(payments.remarks, s),
          ilike(accounts.accountName, s),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let query = db
      .select({
        payment: payments,
        daybook: daybooks,
        daybookGroup: daybookGroups,
        account: accounts,
      })
      .from(payments)
      .leftJoin(daybooks, eq(payments.daybookId, daybooks.id))
      .leftJoin(daybookGroups, eq(daybooks.daybookGroupId, daybookGroups.id))
      .leftJoin(accounts, eq(payments.accountId, accounts.id))
      .where(whereClause)
      .orderBy(desc(payments.createdAt));

    if (!options?.fetchAll && limit !== -1) {
      query = query.limit(limit).offset((page - 1) * limit) as any;
    }

    const [rows, totalResult] = await Promise.all([
      query,
      db
        .select({ total: count() })
        .from(payments)
        .leftJoin(accounts, eq(payments.accountId, accounts.id))
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.total || 0);

    const data = rows.map(({ payment, daybook, daybookGroup, account }) => ({
      ...payment,
      daybookName: daybook?.daybookName || null,
      daybookGroupName: daybookGroup?.groupName || null,
      accountName: account?.accountName || null,
    }));

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

  async getPaymentById(id: number) {
    const [row] = await db
      .select({
        payment: payments,
        daybook: daybooks,
        daybookGroup: daybookGroups,
        account: accounts,
      })
      .from(payments)
      .leftJoin(daybooks, eq(payments.daybookId, daybooks.id))
      .leftJoin(daybookGroups, eq(daybooks.daybookGroupId, daybookGroups.id))
      .leftJoin(accounts, eq(payments.accountId, accounts.id))
      .where(eq(payments.id, id));

    if (!row) return null;

    const fetchedDetails = await db
      .select()
      .from(paymentDetails)
      .where(eq(paymentDetails.paymentId, id))
      .orderBy(paymentDetails.id);

    return {
      ...row.payment,
      daybookName: row.daybook?.daybookName || null,
      daybookGroupName: row.daybookGroup?.groupName || null,
      accountName: row.account?.accountName || null,
      details: fetchedDetails,
    };
  }

  async createPayment(data: any) {
    return await db.transaction(async (tx) => {
      const { details, ...paymentData } = data;

      // Calculate total amount from details if not explicitly set
      let totalAmount = paymentData.totalAmount || "0";
      if (details && Array.isArray(details) && details.length > 0) {
        const sum = details.reduce(
          (acc: number, item: any) => acc + (parseFloat(item.amount) || 0),
          0,
        );
        totalAmount = String(sum);
      }

      let srNo = 1;

      if (paymentData.daybookId) {
        const [latest] = await tx
          .select({ srNo: payments.srNo })
          .from(payments)
          .where(eq(payments.daybookId, Number(paymentData.daybookId)))
          .orderBy(desc(payments.id))
          .limit(1);

        srNo = (Number(latest?.srNo) || 0) + 1;
      }

      // Insert payment header
      const [newPayment] = await tx
        .insert(payments)
        .values({
          srNo,
          voucherNo: paymentData.voucherNo,
          voucherDate: new Date(paymentData.voucherDate || new Date()),
          transactionType: paymentData.transactionType || "Cash Payment",
          daybookId: Number(paymentData.daybookId),
          accountId: Number(paymentData.accountId),
          accountNo: paymentData.accountNo
            ? String(paymentData.accountNo)
            : null,
          totalAmount,
          remarks: paymentData.remarks ? String(paymentData.remarks) : null,
          isActive: paymentData.isActive ?? true,
        })
        .returning();

      let insertedDetails: any[] = [];
      if (details && Array.isArray(details) && details.length > 0) {
        const detailsToInsert = details.map((item: any) => ({
          paymentId: newPayment.id,
          amount: String(item.amount || 0),
          remarks: item.remarks ? String(item.remarks) : null,
        }));

        insertedDetails = await tx
          .insert(paymentDetails)
          .values(detailsToInsert)
          .returning();
      }

      return {
        ...newPayment,
        details: insertedDetails,
      };
    });
  }

  async updatePayment(id: number, data: any) {
    return await db.transaction(async (tx) => {
      const { details, ...paymentData } = data;

      let totalAmount = paymentData.totalAmount;
      if (details && Array.isArray(details)) {
        const sum = details.reduce(
          (acc: number, item: any) => acc + (parseFloat(item.amount) || 0),
          0,
        );
        totalAmount = String(sum);
      }

      const updatePayload: any = {
        updatedAt: new Date(),
      };
      if (totalAmount !== undefined) updatePayload.totalAmount = totalAmount;
      if (paymentData.voucherNo !== undefined)
        updatePayload.voucherNo = paymentData.voucherNo;
      if (paymentData.srNo !== undefined)
        updatePayload.srNo = Number(paymentData.srNo);
      if (paymentData.voucherDate !== undefined)
        updatePayload.voucherDate = new Date(paymentData.voucherDate);
      if (paymentData.transactionType !== undefined)
        updatePayload.transactionType = paymentData.transactionType;
      if (paymentData.daybookId !== undefined)
        updatePayload.daybookId = Number(paymentData.daybookId);
      if (paymentData.accountId !== undefined)
        updatePayload.accountId = Number(paymentData.accountId);
      if (paymentData.accountNo !== undefined)
        updatePayload.accountNo = paymentData.accountNo
          ? String(paymentData.accountNo)
          : null;
      if (paymentData.remarks !== undefined)
        updatePayload.remarks = paymentData.remarks
          ? String(paymentData.remarks)
          : null;
      if (paymentData.isActive !== undefined)
        updatePayload.isActive = Boolean(paymentData.isActive);

      const [updatedPayment] = await tx
        .update(payments)
        .set(updatePayload)
        .where(eq(payments.id, id))
        .returning();

      if (!updatedPayment) return null;

      let finalDetails: any[] = [];
      if (details && Array.isArray(details)) {
        const idsToKeep = details
          .map((d: any) => d.id)
          .filter((itemId: any) => itemId != null);

        if (idsToKeep.length > 0) {
          await tx
            .delete(paymentDetails)
            .where(
              and(
                eq(paymentDetails.paymentId, id),
                notInArray(paymentDetails.id, idsToKeep),
              ),
            );
        } else {
          await tx
            .delete(paymentDetails)
            .where(eq(paymentDetails.paymentId, id));
        }

        for (const item of details) {
          if (item.id) {
            await tx
              .update(paymentDetails)
              .set({
                amount: String(item.amount || 0),
                remarks: item.remarks ? String(item.remarks) : null,
                updatedAt: new Date(),
              })
              .where(eq(paymentDetails.id, item.id));
          } else {
            await tx.insert(paymentDetails).values({
              paymentId: id,
              amount: String(item.amount || 0),
              remarks: item.remarks ? String(item.remarks) : null,
            });
          }
        }

        finalDetails = await tx
          .select()
          .from(paymentDetails)
          .where(eq(paymentDetails.paymentId, id))
          .orderBy(paymentDetails.id);
      }

      return {
        ...updatedPayment,
        details: finalDetails,
      };
    });
  }

  async deletePayment(id: number) {
    return await db.transaction(async (tx) => {
      await tx.delete(paymentDetails).where(eq(paymentDetails.paymentId, id));
      const [deleted] = await tx
        .delete(payments)
        .where(eq(payments.id, id))
        .returning();
      return deleted;
    });
  }
}

export const paymentService = new PaymentService();
