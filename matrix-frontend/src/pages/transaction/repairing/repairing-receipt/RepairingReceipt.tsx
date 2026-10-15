import type { CellValueChangedEvent } from "ag-grid-community";
import { AlertCircle } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { generateVoucherNo } from "@/api/daybooks";
import {
  useCreateOrder,
  useDeleteOrder,
  useOrder,
  useUpdateOrder,
} from "@/api/orders";
import { confirmAlert } from "@/components/common/AlertModal";
import { FormFooter } from "@/components/common/FormFooter";
import { QuickAccountCreateDialog } from "@/components/common/QuickAccountCreateDialog";
import { WEB_ROUTES } from "@/config/webRoutes";
import { decodeURL } from "@/lib/utils";
import { todayISO, toISODate } from "@/utils/date";

import { CustomerOrderDetailsCard } from "./components/CustomerOrderDetailsCard";
import { ReceiptCollectionSummary } from "./components/ReceiptCollectionSummary";
import { RepairItemsTable } from "./components/RepairItemsTable";
import {
  emptyLine,
  n,
  type RepairingReceiptFormData,
  type RepairingReceiptTotals,
  type RepairLine,
} from "./types";
import { useRepairingReceiptColumns } from "./useRepairingReceiptColumns";

const RepairingReceipt: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const route = decodeURL<{ id?: number; readOnly?: boolean }>(token);
  const orderId = Number(route?.id || 0);
  const isEditing = orderId > 0;
  const readOnly = Boolean(route?.readOnly);

  const { data: order, isLoading } = useOrder(isEditing ? orderId : undefined);
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();

  const [quickAccountOpen, setQuickAccountOpen] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<RepairingReceiptFormData>({
    daybookId: 0,
    voucherNo: "",
    srNo: 0,
    voucherDate: todayISO(),
    accountId: 0,
    accountName: "",
    salesmanName: "",
    reference: "",
    remarks: "",
    cashAmount: 0,
    bankAmount: 0,
    cashDaybookId: 0,
    bankDaybookId: 0,
    cashReference: "",
    bankReference: "",
  });

  const [lines, setLines] = useState<RepairLine[]>([emptyLine()]);

  // Financial and Quantity Computations
  const taxableTotal = useMemo(
    () => lines.reduce((sum, line) => sum + n(line.amount), 0),
    [lines],
  );
  const labourTotal = useMemo(
    () => lines.reduce((sum, line) => sum + n(line.labourAmount), 0),
    [lines],
  );
  const grandTotal = taxableTotal + labourTotal;
  const received = n(form.cashAmount) + n(form.bankAmount);
  const balance = grandTotal - received;

  const validLines = useMemo(
    () => lines.filter((line) => line.itemId > 0 && n(line.pcs) > 0),
    [lines],
  );

  const totals: RepairingReceiptTotals = useMemo(
    () => ({
      itemCount: lines.filter((l) => l.itemId > 0).length,
      totalPcs: lines.reduce((sum, l) => sum + n(l.pcs), 0),
      totalGrossWt: lines.reduce((sum, l) => sum + n(l.grossWt), 0),
      totalNetWt: lines.reduce((sum, l) => sum + n(l.netWt), 0),
      taxableTotal,
      labourTotal,
      grandTotal,
      received,
      balance,
      validLinesCount: validLines.length,
    }),
    [
      lines,
      taxableTotal,
      labourTotal,
      grandTotal,
      received,
      balance,
      validLines.length,
    ],
  );

  const isSaving = createOrder.isPending || updateOrder.isPending;

  // Daybook Selection & Auto Voucher Generation
  const selectDaybook = useCallback(async (daybookId: number) => {
    if (!daybookId) return;
    try {
      const result = await generateVoucherNo({
        daybookId,
        tableName: "orders",
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

  // Load existing order details for editing or viewing
  useEffect(() => {
    if (!order) return;
    setForm({
      daybookId: order.daybookId || 0,
      voucherNo: order.voucherNo,
      srNo: order.srNo || 0,
      voucherDate: toISODate(order.voucherDate),
      accountId: order.accountId || 0,
      accountName: order.accountName || "",
      salesmanName: order.salesmanName || "",
      reference: order.reference || "",
      remarks: order.remarks || "",
      cashAmount: n(order.cashAmount),
      bankAmount: n(order.bankAmount),
      cashDaybookId: order.cashDaybookId || 0,
      bankDaybookId: order.bankDaybookId || 0,
      cashReference: order.cashReference || "",
      bankReference: order.bankReference || "",
    });

    setLines(
      order.itemLines.length
        ? order.itemLines.map((line) => ({
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
        : [emptyLine()],
    );
  }, [order]);

  // Table Line Handlers
  const handleDeleteLine = useCallback((rowIndex: number | undefined) => {
    if (rowIndex == null) return;
    setLines((current) =>
      current.length <= 1
        ? [emptyLine()]
        : current.filter((_, idx) => idx !== rowIndex),
    );
  }, []);

  const handleUpdateLine = useCallback(
    (rowIndex: number, patch: Partial<RepairLine>) => {
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
    (e: CellValueChangedEvent<RepairLine>) => {
      const field = e.colDef?.field as keyof RepairLine | undefined;
      if (!field || !e.data || e.node?.rowIndex == null) return;
      const rowIndex = e.node.rowIndex;

      setLines((prev) =>
        prev.map((line, idx) => {
          if (idx !== rowIndex) return line;
          const updated: RepairLine = {
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
            field === "amount"
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
    setLines((current) => [...current, emptyLine()]);
  }, []);

  // AG-Grid Columns Hook
  const lineColumns = useRepairingReceiptColumns({
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

  // Validation & Navigation
  const canSave =
    !readOnly &&
    form.daybookId > 0 &&
    form.accountId > 0 &&
    validLines.length > 0 &&
    balance >= 0;

  const back = useCallback(() => {
    navigate(WEB_ROUTES.TRANSACTION.REPAIRING_RECEIPT_LIST);
  }, [navigate]);

  // Save handler
  const save = () => {
    if (!canSave) return;
    setError("");

    const payload = {
      ...form,
      subtotal: grandTotal,
      grandTotal,
      itemLines: validLines.map(({ key: _k, itemName: _n, ...line }) => line),
    };

    const callbacks = {
      onSuccess: back,
      onError: (reason: any) =>
        setError(
          reason?.response?.data?.error ||
            reason?.message ||
            "Unable to save repairing receipt",
        ),
    };

    if (isEditing) {
      updateOrder.mutate({ id: orderId, data: payload }, callbacks);
    } else {
      createOrder.mutate(payload as any, callbacks);
    }
  };

  // Delete handler
  const remove = async () => {
    if (
      isEditing &&
      (await confirmAlert({
        title: "Delete Repairing Receipt?",
        description:
          "Linked cash and bank receipts will also be deleted. This action cannot be undone.",
        confirmText: "Delete",
        variant: "danger",
      }))
    ) {
      deleteOrder.mutate(orderId, {
        onSuccess: back,
        onError: () => setError("Unable to delete receipt"),
      });
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-2 text-sm text-slate-500">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-action border-t-transparent" />
        <span>Loading repairing receipt details…</span>
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

        {/* Customer & Order Information Section (Contains DaybookSelect in Voucher Details) */}
        <CustomerOrderDetailsCard
          readOnly={readOnly}
          form={form}
          onChangeForm={setForm}
          onOpenQuickAccount={() => setQuickAccountOpen(true)}
          onSelectDaybook={selectDaybook}
        />

        {/* Repair Items AG Grid Table Section */}
        <RepairItemsTable
          readOnly={readOnly}
          lines={lines}
          lineColumns={lineColumns}
          gridTotals={gridTotals}
          onAddLine={handleAddLine}
          onCellValueChanged={handleCellValueChanged}
        />

        {/* Financial Valuation & Advance Receipt Summary */}
        <ReceiptCollectionSummary
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
        isDeleting={deleteOrder.isPending}
        onSave={readOnly ? undefined : save}
        saveText="Save"
        isSaving={isSaving}
        isSaveDisabled={!canSave || isSaving}
      />
    </div>
  );
};

export default RepairingReceipt;
