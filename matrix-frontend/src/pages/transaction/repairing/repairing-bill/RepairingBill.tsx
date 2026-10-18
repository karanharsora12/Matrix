import type { CellValueChangedEvent } from "ag-grid-community";
import { AlertCircle } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { generateVoucherNo } from "@/api/daybooks";
import {
  useCreateSale,
  useDeleteSale,
  useSale,
  useUpdateSale,
  type EligibleReceipt,
} from "@/api/sales";
import { confirmAlert } from "@/components/common/AlertModal";
import { FormFooter } from "@/components/common/FormFooter";
import { InvoicePreviewModal } from "@/components/common/InvoicePreviewModal";
import { QuickAccountCreateDialog } from "@/components/common/QuickAccountCreateDialog";
import { fetchPrintConfig, printTransactionInvoice } from "@/api/report";
import { WEB_ROUTES } from "@/config/webRoutes";
import { decodeURL } from "@/lib/utils";
import { todayISO, toISODate } from "@/utils/date";

import { RepairingBillHeaderCard } from "./components/RepairingBillHeaderCard";
import { RepairingBillItemsTable } from "./components/RepairingBillItemsTable";
import { RepairingBillSummary } from "./components/RepairingBillSummary";
import {
  emptyBillLine,
  n,
  type RepairingBillFormData,
  type RepairingBillLine,
  type RepairingBillTotals,
} from "./types";
import { useRepairingBillColumns } from "./useRepairingBillColumns";

const RepairingBill: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const route = decodeURL<{ id?: number; readOnly?: boolean }>(token);
  const saleId = Number(route?.id || 0);
  const isEditing = saleId > 0;
  const readOnly = Boolean(route?.readOnly);

  const { data: sale, isLoading } = useSale(isEditing ? saleId : undefined);
  const createSale = useCreateSale();
  const updateSale = useUpdateSale();
  const deleteSale = useDeleteSale();

  const [quickAccountOpen, setQuickAccountOpen] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<RepairingBillFormData>({
    daybookId: 0,
    voucherNo: "",
    srNo: 0,
    voucherDate: todayISO(),
    accountId: 0,
    accountName: "",
    salesmanName: "",
    customerReference: "",
    remarks: "",
    receiptId: null,
    receiptVoucherNo: "",
    taxRate: 0,
    discountRate: 0,
    discountAmount: 0,
    advanceAdjusted: 0,
    cashAmount: 0,
    bankAmount: 0,
    cashDaybookId: 0,
    bankDaybookId: 0,
    cashReference: "",
    bankReference: "",
  });

  const [lines, setLines] = useState<RepairingBillLine[]>([emptyBillLine()]);

  // Financial and Quantity Computations
  const taxableTotal = useMemo(
    () => lines.reduce((sum, line) => sum + n(line.amount), 0),
    [lines],
  );
  const labourTotal = useMemo(
    () => lines.reduce((sum, line) => sum + n(line.labourAmount), 0),
    [lines],
  );
  const itemSubtotal = taxableTotal + labourTotal;

  const discountAmount = useMemo(() => {
    if (form.discountRate > 0) {
      return Number(((itemSubtotal * form.discountRate) / 100).toFixed(2));
    }
    return n(form.discountAmount);
  }, [form.discountRate, form.discountAmount, itemSubtotal]);

  const taxableAfterDiscount = Math.max(0, itemSubtotal - discountAmount);

  const taxAmount = useMemo(() => {
    if (form.taxRate > 0) {
      return Number(((taxableAfterDiscount * form.taxRate) / 100).toFixed(2));
    }
    return 0;
  }, [form.taxRate, taxableAfterDiscount]);

  const rawGrandTotal = taxableAfterDiscount + taxAmount;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

  const advanceAdjusted = n(form.advanceAdjusted);
  const settledAmount = n(form.cashAmount) + n(form.bankAmount);
  const balance = grandTotal - advanceAdjusted - settledAmount;

  const validLines = useMemo(
    () => lines.filter((line) => line.itemId > 0 && n(line.pcs) > 0),
    [lines],
  );

  const totals: RepairingBillTotals = useMemo(
    () => ({
      itemCount: lines.filter((l) => l.itemId > 0).length,
      totalPcs: lines.reduce((sum, l) => sum + n(l.pcs), 0),
      totalGrossWt: lines.reduce((sum, l) => sum + n(l.grossWt), 0),
      totalNetWt: lines.reduce((sum, l) => sum + n(l.netWt), 0),
      taxableTotal,
      labourTotal,
      subtotal: itemSubtotal,
      discountAmount,
      taxAmount,
      roundOff,
      grandTotal,
      advanceAdjusted,
      settledAmount,
      balance,
      validLinesCount: validLines.length,
    }),
    [
      lines,
      taxableTotal,
      labourTotal,
      itemSubtotal,
      discountAmount,
      taxAmount,
      roundOff,
      grandTotal,
      advanceAdjusted,
      settledAmount,
      balance,
      validLines.length,
    ],
  );

  const isSaving = createSale.isPending || updateSale.isPending;

  // Daybook Selection & Auto Voucher Generation
  const selectDaybook = useCallback(async (daybookId: number) => {
    if (!daybookId) return;
    try {
      const result = await generateVoucherNo({
        daybookId,
        tableName: "sales",
      });
      setForm((current) => ({
        ...current,
        daybookId,
        voucherNo: result.data?.voucherNo || "Auto",
        srNo: n(result.data?.srNo) || 1,
      }));
    } catch {
      setForm((current) => ({
        ...current,
        daybookId,
        voucherNo: "Auto",
        srNo: 1,
      }));
    }
  }, []);

  // Handler: Selecting an eligible Repairing Receipt (Receipt-based Billing)
  const handleSelectReceipt = useCallback((receipt: EligibleReceipt) => {
    setForm((current) => ({
      ...current,
      accountId: receipt.accountId,
      accountName: receipt.accountName,
      salesmanName: receipt.salesmanName || current.salesmanName,
      customerReference: receipt.customerPhone || current.customerReference,
      remarks: receipt.remarks || current.remarks,
      receiptId: receipt.id,
      receiptVoucherNo: receipt.voucherNo,
      advanceAdjusted: n(receipt.advancePaid),
    }));

    if (receipt.itemLines && receipt.itemLines.length > 0) {
      setLines(
        receipt.itemLines.map((it) => ({
          ...it,
          key: String(it.id || crypto.randomUUID()),
          receiptItemId: it.id ? Number(it.id) : null,
          pcs: n(it.pcs),
          grossWt: n(it.grossWt),
          netWt: n(it.netWt),
          rate: n(it.rate),
          labourRate: n(it.labourRate),
          labourAmount: n(it.labourAmount || n(it.pcs) * n(it.labourRate)),
          amount: n(it.amount),
          deliveryDate: toISODate(it.deliveryDate) || todayISO(),
        })),
      );
    }
  }, []);

  // Handler: Unlinking receipt (switching to manual bill)
  const handleClearReceipt = useCallback(() => {
    setForm((current) => ({
      ...current,
      receiptId: null,
      receiptVoucherNo: "",
      advanceAdjusted: 0,
    }));
  }, []);

  // Load existing bill details for editing or viewing
  useEffect(() => {
    if (!sale) return;
    setForm({
      daybookId: sale.daybookId || 0,
      voucherNo: sale.voucherNo,
      srNo: sale.srNo || 0,
      voucherDate: toISODate(sale.voucherDate),
      accountId: sale.accountId || 0,
      accountName: sale.accountName || "",
      salesmanName: sale.salesmanName || "",
      customerReference: sale.customerReference || sale.reference || "",
      remarks: sale.remarks || "",
      receiptId: sale.receiptId || null,
      receiptVoucherNo: sale.receiptVoucherNo || "",
      taxRate: n(sale.taxRate),
      discountRate: n(sale.discountRate),
      discountAmount: n(sale.discountAmount),
      advanceAdjusted: n(sale.advanceAmount ?? sale.advanceAdjusted),
      cashAmount: n(sale.cashAmount),
      bankAmount: n(sale.bankAmount),
      cashDaybookId: sale.cashDaybookId || 0,
      bankDaybookId: sale.bankDaybookId || 0,
      cashReference: sale.cashReference || "",
      bankReference: sale.bankReference || "",
    });

    setLines(
      sale.itemLines.length
        ? sale.itemLines.map((line) => ({
            ...line,
            key: String(line.id || crypto.randomUUID()),
            pcs: n(line.pcs),
            grossWt: n(line.grossWt),
            netWt: n(line.netWt),
            amount: n(line.amount),
            labourRate: n(line.labourRate),
            labourAmount: n(
              line.labourAmount || n(line.pcs) * n(line.labourRate),
            ),
            deliveryDate: toISODate(line.deliveryDate) || todayISO(),
          }))
        : [emptyBillLine()],
    );
  }, [sale]);

  // Table Line Handlers
  const handleDeleteLine = useCallback((rowIndex: number | undefined) => {
    if (rowIndex == null) return;
    setLines((current) =>
      current.length <= 1
        ? [emptyBillLine()]
        : current.filter((_, idx) => idx !== rowIndex),
    );
  }, []);

  const handleUpdateLine = useCallback(
    (rowIndex: number, patch: Partial<RepairingBillLine>) => {
      setLines((prev) =>
        prev.map((line, idx) => {
          if (idx !== rowIndex) return line;
          const updated = { ...line, ...patch };
          if ("pcs" in patch || "labourRate" in patch) {
            updated.pcs = n(updated.pcs);
            updated.labourRate = n(updated.labourRate);
            updated.labourAmount = updated.pcs * updated.labourRate;
          }
          return updated;
        }),
      );
    },
    [],
  );

  const handleCellValueChanged = useCallback(
    (e: CellValueChangedEvent<RepairingBillLine>) => {
      const field = e.colDef?.field as keyof RepairingBillLine | undefined;
      if (!field || !e.data || e.node?.rowIndex == null) return;
      const rowIndex = e.node.rowIndex;

      setLines((prev) =>
        prev.map((line, idx) => {
          if (idx !== rowIndex) return line;
          const updated: RepairingBillLine = {
            ...line,
            [field]: e.newValue,
          };
          if (field === "pcs" || field === "labourRate") {
            updated.pcs = n(updated.pcs);
            updated.labourRate = n(updated.labourRate);
            updated.labourAmount = updated.pcs * updated.labourRate;
          } else if (
            field === "grossWt" ||
            field === "netWt" ||
            field === "amount" ||
            field === "labourAmount"
          ) {
            updated[field] = n(updated[field]);
          }
          return updated;
        }),
      );
    },
    [],
  );

  const handleAddLine = useCallback(() => {
    setLines((current) => [...current, emptyBillLine()]);
  }, []);

  const lineColumns = useRepairingBillColumns({
    readOnly,
    onDeleteLine: handleDeleteLine,
    onUpdateLine: handleUpdateLine,
  });

  const gridTotals = useMemo(
    () => [
      {
        itemGroupName: "TOTAL",
        amount: taxableTotal,
        labourAmount: labourTotal,
      },
    ],
    [labourTotal, taxableTotal],
  );

  // Post-save and printing states
  const [postSaveAction, setPostSaveAction] = useState<"preview" | "print" | "none">("preview");
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceTarget, setInvoiceTarget] = useState<{ id: number; voucherNo: string } | null>(null);
  const [navigateOnModalClose, setNavigateOnModalClose] = useState(false);

  // Load configured default post-save action
  useEffect(() => {
    fetchPrintConfig("repairing-bill")
      .then((cfg) => {
        if (cfg?.defaultPostSaveAction) {
          setPostSaveAction(cfg.defaultPostSaveAction as any);
        }
      })
      .catch((err) => console.warn("Could not load print config:", err));
  }, []);

  // Validation
  const canSave =
    !readOnly &&
    form.daybookId > 0 &&
    form.accountId > 0 &&
    validLines.length > 0 &&
    balance >= 0;

  const back = useCallback(() => {
    navigate(WEB_ROUTES.TRANSACTION.REPAIRING_BILL_LIST);
  }, [navigate]);

  // Save handler with configurable post-save action
  const save = (actionOverride?: "preview" | "print" | "none") => {
    if (!canSave) return;
    setError("");

    const action = actionOverride || postSaveAction;

    const payload = {
      ...form,
      subtotal: itemSubtotal,
      discountAmount,
      taxAmount,
      roundOff,
      grandTotal,
      advanceAmount: advanceAdjusted,
      itemLines: validLines.map(({ key: _k, itemName: _n, ...line }) => line),
    };

    const callbacks = {
      onSuccess: (savedData: any) => {
        const resultId = isEditing ? saleId : savedData?.id;
        const resultVoucherNo = isEditing ? form.voucherNo : (savedData?.voucherNo || form.voucherNo);

        if (action === "preview" && resultId) {
          setInvoiceTarget({ id: resultId, voucherNo: resultVoucherNo });
          setNavigateOnModalClose(true);
          setInvoiceModalOpen(true);
        } else if (action === "print" && resultId) {
          printTransactionInvoice(resultId)
            .catch((e) => console.warn("Direct print error:", e))
            .finally(() => back());
        } else {
          back();
        }
      },
      onError: (reason: any) =>
        setError(
          reason?.response?.data?.error ||
            reason?.message ||
            "Unable to save repairing bill",
        ),
    };

    if (isEditing) {
      updateSale.mutate({ id: saleId, data: payload }, callbacks);
    } else {
      createSale.mutate(payload as any, callbacks);
    }
  };

  // Delete handler
  const remove = async () => {
    if (
      isEditing &&
      (await confirmAlert({
        title: "Delete Repairing Bill?",
        description:
          "Linked cash and bank payment receipts will also be deleted, and the original Repairing Receipt will be restored for billing. This action cannot be undone.",
        confirmText: "Delete",
        variant: "danger",
      }))
    ) {
      deleteSale.mutate(saleId, {
        onSuccess: back,
        onError: () => setError("Unable to delete bill"),
      });
    }
  };

  // Print handler - opens authoritative invoice preview
  const printInvoice = () => {
    if (isEditing && saleId) {
      setInvoiceTarget({ id: saleId, voucherNo: form.voucherNo });
      setNavigateOnModalClose(false);
      setInvoiceModalOpen(true);
    } else {
      setError("Please save the bill before printing invoice.");
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-2 text-sm text-slate-500">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-action border-t-transparent" />
        <span>Loading repairing bill details…</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex min-h-full flex-col bg-slate-50/70 p-3 sm:p-5 dark:bg-zinc-950">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-sm text-rose-800 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer & Order Information Section with Receipt Reference Selector */}
        <RepairingBillHeaderCard
          readOnly={readOnly}
          form={form}
          onChangeForm={setForm}
          onOpenQuickAccount={() => setQuickAccountOpen(true)}
          onSelectDaybook={selectDaybook}
          onSelectReceipt={handleSelectReceipt}
          onClearReceipt={handleClearReceipt}
          currentSaleId={isEditing ? saleId : undefined}
        />

        {/* Repair Items AG Grid Table Section */}
        <RepairingBillItemsTable
          readOnly={readOnly}
          lines={lines}
          lineColumns={lineColumns}
          gridTotals={gridTotals}
          onAddLine={handleAddLine}
          onCellValueChanged={handleCellValueChanged}
        />

        {/* Financial Valuation, Receipt Advance Adjustment & Settlement Summary */}
        <RepairingBillSummary
          readOnly={readOnly}
          form={form}
          onChangeForm={setForm}
          totals={totals}
        />

        {/* Quick Account Creation Dialog */}
        <QuickAccountCreateDialog
          open={quickAccountOpen}
          onOpenChange={setQuickAccountOpen}
          onCreated={(account) =>
            setForm((current) => ({
              ...current,
              accountId: account.id,
              accountName: account.accountName,
            }))
          }
        />
      </div>

      <FormFooter
        onBack={back}
        onDelete={isEditing && !readOnly ? remove : undefined}
        isDeleting={deleteSale.isPending}
        onSave={readOnly ? undefined : () => save()}
        saveText={
          isEditing
            ? "Update Bill"
            : postSaveAction === "print"
            ? "Save & Print"
            : postSaveAction === "preview"
            ? "Save & Preview"
            : "Save Only"
        }
        isSaving={isSaving}
        isSaveDisabled={!canSave || isSaving}
        onPrint={isEditing ? printInvoice : undefined}
        printText="Print Invoice"
        extraActions={
          !readOnly && !isEditing ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
              <span className="text-[11px]">Post-Save:</span>
              <select
                value={postSaveAction}
                onChange={(e) => setPostSaveAction(e.target.value as any)}
                className="h-8 rounded-lg border border-input bg-background px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="preview">Save & Preview</option>
                <option value="print">Save & Print</option>
                <option value="none">Save Only</option>
              </select>
            </div>
          ) : undefined
        }
      />

      {/* Invoice Preview & Print Modal */}
      <InvoicePreviewModal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        transactionId={invoiceTarget?.id}
        transactionType="repairing-bill"
        voucherNo={invoiceTarget?.voucherNo}
        onClose={() => {
          if (navigateOnModalClose) {
            back();
          }
        }}
      />
    </div>
  );
};

export default RepairingBill;
