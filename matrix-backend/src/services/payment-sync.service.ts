import { eq, and, desc } from "drizzle-orm";
import {
  payments,
  paymentDetails,
  daybooks,
  daybookGroups,
  accounts,
} from "../db/schema";

export interface SyncPaymentParams {
  referenceType: "SALES" | "PURCHASE" | string;
  referenceId: number;
  voucherNo: string;
  voucherDate: Date;
  accountId: number | null;
  cashAmount?: number | string | null;
  bankAmount?: number | string | null;
  userId?: number | null;
}

export class PaymentSyncService {
  /**
   * Helper to resolve the appropriate daybook for cash or bank
   */
  private async getDaybookForGroup(tx: any, groupShortName: "CASH" | "BANK") {
    const result = await tx
      .select({
        daybook: daybooks,
        group: daybookGroups,
      })
      .from(daybooks)
      .innerJoin(daybookGroups, eq(daybooks.daybookGroupId, daybookGroups.id))
      .where(
        and(
          eq(daybookGroups.shortName, groupShortName),
          eq(daybooks.isActive, true),
        ),
      )
      .limit(1);

    if (result.length > 0) {
      return result[0].daybook;
    }

    // Fallback: any active daybook
    const [fallback] = await tx
      .select()
      .from(daybooks)
      .where(eq(daybooks.isActive, true))
      .limit(1);

    return fallback || null;
  }

  /**
   * Fallback account if accountId is missing
   */
  private async resolveAccountId(tx: any, accountId: number | null) {
    if (accountId && !isNaN(Number(accountId))) {
      return Number(accountId);
    }
    const [firstAcc] = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.isActive, true))
      .limit(1);
    return firstAcc ? firstAcc.id : 1;
  }

  /**
   * Synchronize cash and bank payment vouchers for a transaction (Sale, Purchase, etc.)
   */
  async syncTransactionPayments(tx: any, params: SyncPaymentParams) {
    const {
      referenceType,
      referenceId,
      voucherNo,
      voucherDate,
      userId,
    } = params;

    const cashAmountNum = parseFloat(String(params.cashAmount || 0));
    const bankAmountNum = parseFloat(String(params.bankAmount || 0));
    const effectiveAccountId = await this.resolveAccountId(tx, params.accountId);

    // 1. Synchronize Cash Payment / Receipt
    await this.syncSingleModePayment(tx, {
      referenceType,
      referenceId,
      voucherNo,
      voucherDate,
      accountId: effectiveAccountId,
      amount: cashAmountNum,
      groupShortName: "CASH",
      transactionType: referenceType === "SALES" ? "CREC" : "CPAY",
      modeLabel: "Cash",
      userId,
    });

    // 2. Synchronize Bank Payment / Receipt
    await this.syncSingleModePayment(tx, {
      referenceType,
      referenceId,
      voucherNo,
      voucherDate,
      accountId: effectiveAccountId,
      amount: bankAmountNum,
      groupShortName: "BANK",
      transactionType: referenceType === "SALES" ? "BREC" : "BPAY",
      modeLabel: "Bank",
      userId,
    });
  }

  private async syncSingleModePayment(
    tx: any,
    options: {
      referenceType: string;
      referenceId: number;
      voucherNo: string;
      voucherDate: Date;
      accountId: number;
      amount: number;
      groupShortName: "CASH" | "BANK";
      transactionType: string;
      modeLabel: string;
      userId?: number | null | undefined;
    },
  ) {
    const {
      referenceType,
      referenceId,
      voucherNo,
      voucherDate,
      accountId,
      amount,
      groupShortName,
      transactionType,
      modeLabel,
      userId,
    } = options;

    // Check if an existing payment entry exists for this transaction and transactionType
    const existingPayments = await tx
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.referenceType, referenceType),
          eq(payments.referenceId, referenceId),
          eq(payments.transactionType, transactionType),
        ),
      );

    const existingPayment = existingPayments[0];

    if (amount > 0) {
      if (existingPayment) {
        // Update existing payment entry
        await tx
          .update(payments)
          .set({
            voucherDate,
            accountId,
            totalAmount: String(amount),
            remarks: `${modeLabel} payment for ${referenceType} #${voucherNo}`,
            editBy: userId ? Number(userId) : null,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, existingPayment.id));

        // Update payment detail
        const existingDetails = await tx
          .select()
          .from(paymentDetails)
          .where(eq(paymentDetails.paymentId, existingPayment.id))
          .limit(1);

        if (existingDetails.length > 0) {
          await tx
            .update(paymentDetails)
            .set({
              amount: String(amount),
              remarks: `${modeLabel} entry for ${referenceType} #${voucherNo}`,
              editBy: userId ? Number(userId) : null,
              updatedAt: new Date(),
            })
            .where(eq(paymentDetails.id, existingDetails[0].id));
        } else {
          await tx.insert(paymentDetails).values({
            paymentId: existingPayment.id,
            amount: String(amount),
            remarks: `${modeLabel} entry for ${referenceType} #${voucherNo}`,
            addBy: userId ? Number(userId) : null,
            editBy: userId ? Number(userId) : null,
          });
        }
      } else {
        // Create new payment entry
        const daybook = await this.getDaybookForGroup(tx, groupShortName);
        if (!daybook) {
          console.warn(
            `No daybook found for group ${groupShortName}; skipping auto-payment entry.`,
          );
          return;
        }

        // Generate next sequence number for this daybook
        const [latest] = await tx
          .select({ srNo: payments.srNo })
          .from(payments)
          .where(eq(payments.daybookId, daybook.id))
          .orderBy(desc(payments.id))
          .limit(1);

        const nextSrNo = (Number(latest?.srNo) || 0) + 1;
        const prefix = (
          daybook.voucherPrefix ||
          (transactionType.startsWith("C") ? "CR" : "BR")
        ).trim();
        const generatedVoucherNo =
          prefix.endsWith("-") || prefix.endsWith("/")
            ? `${prefix}${nextSrNo}`
            : `${prefix}-${nextSrNo}`;

        const [newPayment] = await tx
          .insert(payments)
          .values({
            srNo: nextSrNo,
            voucherNo: generatedVoucherNo,
            voucherDate,
            transactionType,
            daybookId: daybook.id,
            accountId,
            totalAmount: String(amount),
            remarks: `${modeLabel} entry for ${referenceType} #${voucherNo}`,
            referenceType,
            referenceId,
            isActive: true,
            addBy: userId ? Number(userId) : null,
            editBy: userId ? Number(userId) : null,
          })
          .returning();

        if (newPayment) {
          await tx.insert(paymentDetails).values({
            paymentId: newPayment.id,
            amount: String(amount),
            remarks: `${modeLabel} entry for ${referenceType} #${voucherNo}`,
            addBy: userId ? Number(userId) : null,
            editBy: userId ? Number(userId) : null,
          });
        }
      }
    } else if (existingPayment) {
      // Amount is 0 or cleared, remove existing payment voucher & details
      await tx
        .delete(paymentDetails)
        .where(eq(paymentDetails.paymentId, existingPayment.id));
      await tx.delete(payments).where(eq(payments.id, existingPayment.id));
    }
  }

  /**
   * Delete all payments linked to a transaction
   */
  async deleteTransactionPayments(
    tx: any,
    referenceType: string,
    referenceId: number,
  ) {
    const linkedPayments = await tx
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          eq(payments.referenceType, referenceType),
          eq(payments.referenceId, referenceId),
        ),
      );

    for (const p of linkedPayments) {
      await tx
        .delete(paymentDetails)
        .where(eq(paymentDetails.paymentId, p.id));
      await tx.delete(payments).where(eq(payments.id, p.id));
    }
  }
}

export const paymentSyncService = new PaymentSyncService();
