import { useAccountMasterData, useAccounts } from "@/api/accounts";
import {
  generateVoucherNo,
  useDaybookGroups,
  useDaybooks,
} from "@/api/daybooks";
import {
  useCreatePayment,
  useDeletePayment,
  usePayment,
  usePayments,
  useUpdatePayment,
  type PaymentDetail,
} from "@/api/payments";
import { confirmAlert } from "@/components/common/AlertModal";
import { DataGrid } from "@/components/common/DataGrid";
import { FormFooter } from "@/components/common/FormFooter";
import { GridDeleteCell } from "@/components/common/GridDeleteCell";
import { PopupTable } from "@/components/common/PopupTable";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import {
  TRANSACTION_TYPE_CONFIG,
  TransactionMenu,
  TransactionType,
} from "@/constants/enums";
import { buildRoute, decodeURL, encodeURL } from "@/lib/utils";
import type {
  CellValueChangedEvent,
  ColDef,
  ICellRendererParams,
} from "ag-grid-community";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

// UI Components
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import {
  Banknote,
  ClipboardList,
  ReceiptText,
  RefreshCw,
  Search,
} from "lucide-react";

export type CashVoucherMode = "payment" | "receipt";

const MODE_META: Record<
  CashVoucherMode,
  {
    transactionType: TransactionType;
    menu: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    listRoute: string;
    formRoute: string;
    addText: string;
    saveText: string;
    voucherPrefixFallback: string;
  }
> = {
  payment: {
    transactionType: TransactionType.CPAY,
    menu: TransactionMenu.PAYMENT,
    title: "Cash Payment",
    subtitle: "Record cash paid out from the cash daybook",
    icon: <Banknote className="h-5 w-5" />,
    listRoute: "/transactions/payments/cash-payment",
    formRoute: "/transactions/payments/cash-payment/:token",
    addText: "Add Cash Payment",
    saveText: "Save Payment",
    voucherPrefixFallback: "CA",
  },
  receipt: {
    transactionType: TransactionType.CREC,
    menu: TransactionMenu.RECEIPT,
    title: "Cash Receipt",
    subtitle: "Record cash received into the cash daybook",
    icon: <ReceiptText className="h-5 w-5" />,
    listRoute: "/transactions/receipt/cash-receipt",
    formRoute: "/transactions/receipt/cash-receipt/:token",
    addText: "Add Cash Receipt",
    saveText: "Save Receipt",
    voucherPrefixFallback: "CR",
  },
};

const VOUCHER_TYPES = [
  "Customer Advance",
  "Customer Outstanding",
  "Supplier Advance",
  "Supplier Outstanding",
];

interface VoucherLine extends PaymentDetail {
  /** local row key (server id when editing, temp-otherwise) */
  rowKey: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyLine = (): VoucherLine => ({
  rowKey: `temp-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
  accountId: 0,
  accountName: "",
  amount: 0,
  remarks: "",
});

const rowHasContent = (l: VoucherLine) =>
  Number(l.amount) > 0 || (l.remarks || "").trim() !== "";

const isCompleteLine = (l: VoucherLine) => Number(l.amount) > 0;

const formatINR = (v: number) =>
  (v || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });

interface CashVoucherFormProps {
  mode: CashVoucherMode;
}

export const CashVoucherForm: React.FC<CashVoucherFormProps> = ({ mode }) => {
  const meta = MODE_META[mode];
  const typeConfig = TRANSACTION_TYPE_CONFIG[meta.transactionType];
  const navigate = useNavigate();
  const params = useParams();
  const tokenData = decodeURL<{ id?: number }>(params?.token);
  const voucherId = tokenData?.id ? Number(tokenData.id) : 0;
  const isEditing = voucherId > 0;

  // --- Master data ---
  const { data: daybooksResp } = useDaybooks();
  const { data: daybookGroupsResp } = useDaybookGroups();
  const { data: accountsResp } = useAccounts();
  const { data: accountMasterResp } = useAccountMasterData();
  const { data: vouchersResp } = usePayments({
    transactionType: meta.transactionType,
  });
  const { data: existingVoucher } = usePayment(
    isEditing ? voucherId : undefined,
  );

  const createMutation = useCreatePayment();
  const updateMutation = useUpdatePayment();
  const deleteMutation = useDeletePayment();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const daybookGroups = daybookGroupsResp?.data || [];
  const accounts = accountsResp?.data || [];
  const allVouchers = vouchersResp?.data || [];

  // Cash daybooks for this voucher type (CASH group)
  const cashDaybooks = useMemo(() => {
    const groupIds = daybookGroups
      .filter((g) => g.shortName === typeConfig.daybookGroupShortName)
      .map((g) => g.id);
    return (daybooksResp?.data || []).filter((d) =>
      groupIds.includes(d.daybookGroupId),
    );
  }, [daybooksResp, daybookGroups, typeConfig.daybookGroupShortName]);

  const groupMap = useMemo(() => {
    const map: Record<number, string> = {};
    (accountMasterResp?.accountGroups || []).forEach((g) => {
      map[g.id] = g.name;
    });
    return map;
  }, [accountMasterResp]);

  const typeMap = useMemo(() => {
    const map: Record<number, string> = {};
    (accountMasterResp?.accountTypes || []).forEach((t) => {
      map[t.id] = t.name;
    });
    return map;
  }, [accountMasterResp]);

  // --- Voucher header state ---
  const [daybookId, setDaybookId] = useState<number>(0);
  const [voucherNo, setVoucherNo] = useState("");
  const [voucherDate, setVoucherDate] = useState<string>(todayISO());
  const [paymentMode, setPaymentMode] = useState<string>(VOUCHER_TYPES[0]);
  const [narration, setNarration] = useState("");

  // Voucher-level account (top)
  const [voucherAccountId, setVoucherAccountId] = useState<number>(0);
  const [voucherAccountName, setVoucherAccountName] = useState("");
  const accountSearchBtnRef = useRef<HTMLButtonElement>(null);

  const [lines, setLines] = useState<VoucherLine[]>([emptyLine()]);

  const selectedDaybook = cashDaybooks.find((d) => d.id === daybookId);

  // --- Voucher number ---
  const handleSelectDaybook = useCallback(
    async (val: string) => {
      const dbId = Number(val);
      if (!dbId) return;
      const db = cashDaybooks.find((d) => d.id === dbId);
      setDaybookId(dbId);
      try {
        const resp = await generateVoucherNo({
          daybookId: dbId,
          daybookGroupId: db?.daybookGroupId,
          tableName: "payments",
        });
        if (resp.success && resp.data?.voucherNo) {
          setVoucherNo(resp.data.voucherNo);
        }
      } catch (err) {
        console.error("Failed to generate voucher number:", err);
        setVoucherNo(`${db?.voucherPrefix || meta.voucherPrefixFallback}-1`);
      }
    },
    [cashDaybooks, meta.voucherPrefixFallback],
  );

  // Default daybook for new vouchers
  useEffect(() => {
    if (!isEditing && cashDaybooks.length > 0 && !daybookId) {
      handleSelectDaybook(String(cashDaybooks[0].id));
    }
  }, [isEditing, cashDaybooks, daybookId, handleSelectDaybook]);

  // Load existing voucher in edit mode
  useEffect(() => {
    if (isEditing && existingVoucher) {
      setDaybookId(existingVoucher.daybookId || 0);
      setVoucherNo(existingVoucher.voucherNo || "");
      setVoucherDate(existingVoucher.voucherDate?.slice(0, 10) || todayISO());
      setPaymentMode(
        VOUCHER_TYPES.includes(existingVoucher.reference || "")
          ? existingVoucher.reference!
          : VOUCHER_TYPES[0],
      );
      setNarration(existingVoucher.remarks || "");
      setVoucherAccountId(existingVoucher.accountId || 0);
      setVoucherAccountName(existingVoucher.accountName || "");
      setLines([
        ...(existingVoucher.details || []).map((d, i) => ({
          ...d,
          amount: Number(d.amount) || 0,
          rowKey: d.id ? `server-${d.id}` : `temp-${i}`,
        })),
        emptyLine(),
      ]);
    }
  }, [isEditing, existingVoucher]);

  // F2 opens the voucher-level account lookup
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        accountSearchBtnRef.current?.click();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // --- Line items (grid-first entry, trailing blank row) ---
  const completeLines = useMemo(() => lines.filter(isCompleteLine), [lines]);

  const totalAmount = useMemo(
    () => completeLines.reduce((s, l) => s + (Number(l.amount) || 0), 0),
    [completeLines],
  );

  const appendTrailingRow = useCallback((rows: VoucherLine[]) => {
    const last = rows[rows.length - 1];
    if (!last || rowHasContent(last)) return [...rows, emptyLine()];
    return rows;
  }, []);

  const handleSelectVoucherAccount = useCallback((account: any) => {
    const name =
      account?.accountName ||
      `${account?.firstName || ""} ${account?.lastName || ""}`.trim();
    const id = Number(account?.id) || 0;
    if (!id) return;
    setVoucherAccountId(id);
    setVoucherAccountName(name);
  }, []);

  const handleDeleteLine = useCallback((rowKey: string) => {
    setLines((prev) => {
      if (prev.length <= 1) return [emptyLine()];
      return prev.filter((l) => l.rowKey !== rowKey);
    });
  }, []);

  const handleCellValueChanged = useCallback(
    (e: CellValueChangedEvent) => {
      const field = e.colDef?.field;
      if (!field || !e.data) return;
      const rowKey = e.data.rowKey;
      setLines((prev) =>
        appendTrailingRow(
          prev.map((l) =>
            l.rowKey === rowKey
              ? {
                  ...l,
                  [field]:
                    field === "amount" ? Number(e.newValue) || 0 : e.newValue,
                }
              : l,
          ),
        ),
      );
    },
    [appendTrailingRow],
  );

  const pinnedTotal = useMemo(
    () => [{ amount: formatINR(totalAmount), remarks: "TOTAL" }],
    [totalAmount],
  );

  const accountPopupColumns = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Account Name",
        field: "accountName",
        minWidth: 200,
        flex: 1,
        valueGetter: (p) =>
          p.data?.accountName ||
          `${p.data?.firstName || ""} ${p.data?.lastName || ""}`.trim() ||
          "-",
      },
      { headerName: "ID", field: "id", type: "numericColumn", width: 65 },
      {
        headerName: "Short Name",
        field: "userName",
        width: 100,
        valueGetter: (p) =>
          p.data?.userName ||
          (p.data?.firstName
            ? p.data.firstName.slice(0, 4).toUpperCase()
            : "-"),
      },
      {
        headerName: "Group Name",
        field: "accountGroupId",
        valueGetter: (p) => groupMap[p.data?.accountGroupId] || "General",
        minWidth: 120,
        width: 130,
      },
      {
        headerName: "Account Type",
        field: "accountTypeId",
        valueGetter: (p) => typeMap[p.data?.accountTypeId] || "-",
        minWidth: 140,
        width: 150,
      },
    ],
    [groupMap, typeMap],
  );

  const lineColumns = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Sr",
        width: 60,
        valueGetter: (p) =>
          p.node?.rowPinned ? "" : (p.node?.rowIndex ?? 0) + 1,
      },
      {
        headerName: "Amount",
        field: "amount",
        width: 170,
        type: "numericColumn",
        editable: (p) => !p.node?.rowPinned,
        cellEditor: "agNumberCellEditor",
        cellEditorParams: { min: 0, step: 0.01, precision: 2 },
        valueParser: (params) => {
          if (params.newValue === "" || params.newValue == null) return 0;
          const n = parseFloat(params.newValue);
          return isNaN(n) ? 0 : n;
        },
        valueFormatter: (p) => {
          if (p.node?.rowPinned) return p.value;
          const n = Number(p.value);
          return n > 0 ? n.toFixed(2) : "";
        },
      },
      {
        headerName: "Remarks",
        field: "remarks",
        width: 220,
        editable: (p) => !p.node?.rowPinned,
      },
      {
        headerName: "",
        width: 52,
        cellRenderer: (p: ICellRendererParams) => (
          <GridDeleteCell {...p} onDelete={handleDeleteLine} />
        ),
        sortable: false,
      },
    ],
    [handleDeleteLine],
  );

  // --- Save / clear / delete / navigate ---
  const isValid =
    daybookId > 0 && voucherAccountId > 0 && completeLines.length > 0;

  const handleSave = useCallback(() => {
    if (!isValid) return;
    const payload = {
      voucherNo,
      voucherDate,
      transactionType: meta.transactionType,
      daybookId,
      daybookName: selectedDaybook?.daybookName,
      accountId: voucherAccountId,
      accountName: voucherAccountName,
      reference: paymentMode,
      totalAmount,
      remarks: narration.trim() || undefined,
      isActive: true,
      details: completeLines.map((l) => ({
        id: l.id,
        accountId: voucherAccountId,
        accountName: voucherAccountName,
        amount: Number(l.amount) || 0,
        remarks: l.remarks,
      })),
    };
    if (isEditing) {
      updateMutation.mutate(
        { id: voucherId, data: payload },
        { onSuccess: () => navigate(meta.listRoute) },
      );
    } else {
      createMutation.mutate(payload as any, {
        onSuccess: () => navigate(meta.listRoute),
      });
    }
  }, [
    isValid,
    completeLines,
    voucherNo,
    voucherDate,
    meta,
    daybookId,
    selectedDaybook,
    voucherAccountId,
    voucherAccountName,
    paymentMode,
    totalAmount,
    narration,
    isEditing,
    voucherId,
    updateMutation,
    createMutation,
    navigate,
  ]);

  const handleClear = useCallback(() => {
    setVoucherDate(todayISO());
    setPaymentMode(VOUCHER_TYPES[0]);
    setNarration("");
    setVoucherAccountId(0);
    setVoucherAccountName("");
    setLines([emptyLine()]);
    if (daybookId) handleSelectDaybook(String(daybookId));
  }, [daybookId, handleSelectDaybook]);

  const handleDelete = useCallback(async () => {
    if (!isEditing) return;
    const confirmed = await confirmAlert({
      title: `Delete ${meta.title}?`,
      description: `Are you sure you want to delete voucher ${voucherNo}? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (confirmed) {
      deleteMutation.mutate(voucherId, {
        onSuccess: () => navigate(meta.listRoute),
      });
    }
  }, [isEditing, meta.title, voucherNo, voucherId, deleteMutation, navigate]);

  const handleNavigateRecord = useCallback(
    (direction: "prev" | "next") => {
      if (allVouchers.length === 0) return;
      const idx = allVouchers.findIndex((v) => v.id === voucherId);
      const target =
        allVouchers[idx + (direction === "next" ? 1 : -1)] ??
        (direction === "next"
          ? allVouchers[0]
          : allVouchers[allVouchers.length - 1]);
      if (target) {
        navigate(
          buildRoute(meta.formRoute, { token: encodeURL({ id: target.id }) }),
        );
      }
    },
    [allVouchers, voucherId, meta.formRoute, navigate],
  );

  return (
    <div className="flex h-full flex-col bg-slate-50/60 dark:bg-zinc-950">
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-3">
        {/* ── VOUCHER CARD: title + fields ── */}
        <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-zinc-800">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-action/10 text-primary-action">
                {meta.icon}
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {isEditing ? `Edit ${meta.title}` : meta.title}
                </h1>
                <p className="text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">
                  {meta.subtitle}
                </p>
              </div>
            </div>
            {voucherNo && (
              <span className="shrink-0 rounded-md bg-primary-action/10 px-2 py-1 text-xs font-semibold text-primary-action">
                {voucherNo}
              </span>
            )}
          </div>

          <div className="grid grid-cols-12 gap-2">
            {/* Daybook */}
            <div className="col-span-12 space-y-1 sm:col-span-6 lg:col-span-3">
              <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                Daybook <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={daybookId ? String(daybookId) : ""}
                onValueChange={handleSelectDaybook}
              >
                <SelectTrigger className="h-8 text-xs font-medium">
                  <SelectValue placeholder="Select Daybook" />
                </SelectTrigger>
                <SelectContent>
                  {cashDaybooks.length > 0 ? (
                    cashDaybooks.map((db) => (
                      <SelectItem key={db.id} value={String(db.id)}>
                        {db.daybookName} (
                        {db.voucherPrefix || meta.voucherPrefixFallback})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No cash daybook found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Voucher No. */}
            <div className="col-span-12 space-y-1 sm:col-span-6 lg:col-span-3">
              <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                Voucher No. <span className="text-rose-500">*</span>
              </Label>
              <div className="flex items-stretch gap-1.5">
                <span className="inline-flex h-8 shrink-0 items-center rounded-md border border-primary-action/25 bg-primary-action/10 px-2 text-xs font-bold text-primary-action">
                  {selectedDaybook?.shortName ||
                    selectedDaybook?.voucherPrefix ||
                    meta.voucherPrefixFallback}
                </span>
                <Input
                  value={voucherNo}
                  disabled
                  className="h-8 text-xs font-medium"
                  placeholder="Auto"
                />
              </div>
            </div>

            {/* Voucher Date */}
            <div className="col-span-12 space-y-1 sm:col-span-6 lg:col-span-3">
              <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                Voucher Date <span className="text-rose-500">*</span>
              </Label>
              <DatePicker
                value={voucherDate}
                onChange={setVoucherDate}
                className="h-8 text-xs"
              />
            </div>

            {/* Payment Type */}
            <div className="col-span-12 space-y-1 sm:col-span-6 lg:col-span-3">
              <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                {mode === "payment" ? "Payment Type" : "Receipt Type"}{" "}
                <span className="text-rose-500">*</span>
              </Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger className="h-8 text-xs font-medium">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {VOUCHER_TYPES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account (voucher level) */}
            <div className="col-span-12 space-y-1 lg:col-span-7">
              <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                Account <span className="text-rose-500">*</span>
              </Label>
              <div className="flex items-stretch gap-1.5">
                <Input
                  value={voucherAccountName}
                  readOnly
                  className="h-8 cursor-default text-xs font-medium"
                  placeholder="Select account (F2)"
                  onClick={() => accountSearchBtnRef.current?.click()}
                />
                <PopupTable
                  trigger={
                    <Button
                      ref={accountSearchBtnRef}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 gap-1.5 px-2.5 text-[11px]"
                      title="Search Account (F2)"
                    >
                      <Search className="h-3 w-3 text-slate-500" />
                      F2
                    </Button>
                  }
                  placement="bottom-end"
                  apiEndpoint={API_ENDPOINTS.ACCOUNTS.BASE}
                  columns={accountPopupColumns}
                  onSelect={handleSelectVoucherAccount}
                  searchPlaceholder="Search accounts..."
                />
              </div>
            </div>

            {/* Narration */}
            <div className="col-span-12 space-y-1 lg:col-span-5">
              <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                Narration
              </Label>
              <Input
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                className="h-8 text-xs"
                placeholder="Overall voucher narration"
              />
            </div>
          </div>
        </div>

        {/* ── LINE ITEMS GRID (fills remaining space) ── */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary-action" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Payment Details
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                Total
              </span>
              <span className="text-sm font-semibold text-primary-action">
                {formatINR(totalAmount)}
              </span>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <DataGrid
              rowData={lines}
              columnDefs={lineColumns}
              pinnedBottomRowData={
                completeLines.length > 0 ? pinnedTotal : undefined
              }
              gridOptions={{
                pagination: false,
                getRowId: (p: any) => p.data?.rowKey,
                onCellValueChanged: handleCellValueChanged,
                singleClickEdit: true,
                onCellKeyDown: (e: any) => {
                  if (
                    e.event instanceof KeyboardEvent &&
                    e.event.key === "Enter" &&
                    !e.node?.rowPinned
                  ) {
                    setLines((prev) => {
                      const idx = prev.findIndex(
                        (l) => l.rowKey === e.data?.rowKey,
                      );
                      if (idx === prev.length - 1 && rowHasContent(prev[idx])) {
                        return [...prev, emptyLine()];
                      }
                      return prev;
                    });
                  }
                },
                defaultColDef: {
                  sortable: false,
                  filter: false,
                  floatingFilter: false,
                  resizable: true,
                },
              }}
            />
          </div>
        </div>
      </div>

      <FormFooter
        showVoucherNavigation={true}
        onNavigatePrev={() => handleNavigateRecord("prev")}
        onNavigateNext={() => handleNavigateRecord("next")}
        onDelete={isEditing ? handleDelete : undefined}
        deleteText="Delete"
        isDeleting={deleteMutation.isPending}
        onClear={handleClear}
        clearText="Clear"
        onBack={() => navigate(meta.listRoute)}
        backText="Back"
        onSave={handleSave}
        saveText={isEditing ? "Update" : meta.saveText}
        isSaving={isSaving}
        isSaveDisabled={!isValid || isSaving}
      />
    </div>
  );
};

export default CashVoucherForm;
