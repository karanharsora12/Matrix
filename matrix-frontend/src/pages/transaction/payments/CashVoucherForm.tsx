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
  NumericalCellEditor,
  formatNumericalValue,
  parseNumericalValue,
} from "@/components/common/NumericalCell";
import {
  Banknote,
  ChevronDown,
  ClipboardList,
  FileText,
  MessageSquareText,
  Plus,
  Receipt,
  ReceiptText,
  Search,
  User,
  UserPlus,
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

interface VoucherLine extends PaymentDetail {}

const todayISO = () => new Date().toISOString().slice(0, 10);

const emptyLine = (): VoucherLine => ({
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

  const initialFormData = useMemo(
    () => ({
      daybookId: 0,
      voucherNo: "",
      srNo: 0,
      voucherDate: todayISO(),
      transactionType: meta.transactionType,
      reference: VOUCHER_TYPES[0],
      accountId: 0,
      accountName: "",
      remarks: "",
    }),
    [meta.transactionType],
  );

  const [formData, setFormData] = useState(initialFormData);
  const accountSearchBtnRef = useRef<HTMLButtonElement>(null);
  const [lines, setLines] = useState<VoucherLine[]>([emptyLine()]);

  const selectedDaybook = useMemo(
    () => cashDaybooks.find((d) => d.id === formData.daybookId),
    [cashDaybooks, formData.daybookId],
  );

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === formData.accountId),
    [accounts, formData.accountId],
  );

  // --- Voucher number generation ---
  const handleSelectDaybook = useCallback(
    async (val: string) => {
      const dbId = Number(val);
      if (!dbId) return;
      const db = cashDaybooks.find((d) => d.id === dbId);
      try {
        const resp = await generateVoucherNo({
          daybookId: dbId,
          daybookGroupId: db?.daybookGroupId,
          tableName: "payments",
        });
        if (resp.success && resp.data) {
          setFormData((prev) => ({
            ...prev,
            daybookId: dbId,
            voucherNo: resp.data.voucherNo,
            srNo: Number(resp.data.srNo) || 1,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            daybookId: dbId,
            voucherNo: `${db?.voucherPrefix || meta.voucherPrefixFallback}-1`,
            srNo: 1,
          }));
        }
      } catch (err) {
        console.error("Failed to generate voucher number:", err);
        setFormData((prev) => ({
          ...prev,
          daybookId: dbId,
          voucherNo: `${db?.voucherPrefix || meta.voucherPrefixFallback}-1`,
          srNo: 1,
        }));
      }
    },
    [cashDaybooks, meta.voucherPrefixFallback],
  );

  // Default daybook for new vouchers
  useEffect(() => {
    if (!isEditing && cashDaybooks.length > 0 && !formData.daybookId) {
      handleSelectDaybook(String(cashDaybooks[0].id));
    }
  }, [isEditing, cashDaybooks, formData.daybookId, handleSelectDaybook]);

  // Load existing voucher in edit mode
  useEffect(() => {
    if (isEditing && existingVoucher) {
      setFormData({
        daybookId: existingVoucher.daybookId || 0,
        voucherNo: existingVoucher.voucherNo || "",
        srNo: existingVoucher.srNo || 0,
        voucherDate: existingVoucher.voucherDate?.slice(0, 10) || todayISO(),
        transactionType:
          existingVoucher.transactionType || meta.transactionType,
        reference: VOUCHER_TYPES.includes(existingVoucher.reference || "")
          ? existingVoucher.reference!
          : VOUCHER_TYPES[0],
        accountId: existingVoucher.accountId || 0,
        accountName: existingVoucher.accountName || "",
        remarks: existingVoucher.remarks || "",
      });
      setLines([
        ...(existingVoucher.details || []).map((d) => ({
          ...d,
          amount: Number(d.amount) || 0,
        })),
        emptyLine(),
      ]);
    }
  }, [isEditing, existingVoucher, meta.transactionType]);

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

  const handleAddLine = useCallback(() => {
    setLines((prev) => appendTrailingRow([...prev, emptyLine()]));
  }, [appendTrailingRow]);

  const handleSelectVoucherAccount = useCallback((account: any) => {
    const name =
      account?.accountName ||
      `${account?.firstName || ""} ${account?.lastName || ""}`.trim();
    const id = Number(account?.id) || 0;
    if (!id) return;
    setFormData((prev) => ({
      ...prev,
      accountId: id,
      accountName: name,
    }));
  }, []);

  const handleDeleteLine = useCallback((index?: number | null) => {
    if (index == null) return;
    setLines((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) return [emptyLine()];
      return next;
    });
  }, []);

  const handleCellValueChanged = useCallback(
    (e: CellValueChangedEvent) => {
      const field = e.colDef?.field;
      if (!field || !e.data || e.node?.rowIndex == null) return;
      const rowIndex = e.node.rowIndex;
      setLines((prev) =>
        appendTrailingRow(
          prev.map((l, idx) =>
            idx === rowIndex
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
    () => [{ amount: totalAmount, id: "Total" }],
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
        field: "id",
        headerName: "#",
        width: 50,
        pinned: "left",
        sortable: false,
        filter: false,
        resizable: false,
        valueGetter: (p) =>
          p.node?.rowPinned ? p.data?.id : (p.node?.rowIndex ?? 0) + 1,
      },
      {
        headerName: "Amount",
        field: "amount",
        width: 120,
        type: "numericColumn",
        cellEditor: NumericalCellEditor,
        cellEditorParams: {
          type: "amount",
          decimals: 2,
        },
        cellClass: "ag-right-aligned-cell",
        headerClass: "ag-right-aligned-header",
        valueParser: (params) =>
          parseNumericalValue(params.newValue, { type: "amount", decimals: 2 }),
        valueFormatter: (params) =>
          formatNumericalValue(
            params.value,
            { type: "amount", decimals: 2 },
            Boolean(params.node?.rowPinned),
          ),
        editable: (p) => !p.node?.rowPinned,
      },
      {
        headerName: "Remarks",
        field: "remarks",
        width: 220,
        editable: (p) => !p.node?.rowPinned,
      },
      {
        headerName: "",
        width: 60,
        cellRenderer: (p: ICellRendererParams) => {
          if (p.node?.rowPinned) return null;
          return (
            <GridDeleteCell
              {...p}
              onDelete={() => handleDeleteLine(p.node?.rowIndex)}
            />
          );
        },
        sortable: false,
      },
    ],
    [handleDeleteLine],
  );

  // --- Save / clear / delete / navigate ---
  const isValid =
    formData.daybookId > 0 &&
    formData.accountId > 0 &&
    completeLines.length > 0;

  const handleSave = useCallback(() => {
    if (!isValid) return;
    const payload = {
      ...formData,
      totalAmount,
      details: completeLines.map((l) => ({
        id: l.id,
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
    formData,
    totalAmount,
    completeLines,
    isEditing,
    voucherId,
    updateMutation,
    createMutation,
    navigate,
    meta.listRoute,
  ]);

  const handleClear = useCallback(() => {
    setFormData(initialFormData);
    setLines([emptyLine()]);
    if (formData.daybookId) {
      handleSelectDaybook(String(formData.daybookId));
    }
  }, [formData.daybookId, handleSelectDaybook, initialFormData]);

  const handleDelete = useCallback(async () => {
    if (!isEditing) return;
    const confirmed = await confirmAlert({
      title: `Delete ${meta.title}?`,
      description: `Are you sure you want to delete voucher ${formData.voucherNo}? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (confirmed) {
      deleteMutation.mutate(voucherId, {
        onSuccess: () => navigate(meta.listRoute),
      });
    }
  }, [
    isEditing,
    meta.title,
    formData.voucherNo,
    voucherId,
    deleteMutation,
    navigate,
  ]);

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
    <div className="min-h-full flex flex-col bg-[#f5f6fa] dark:bg-zinc-950">
      {/* ── PAGE HEADER ── */}
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-action/10 border border-primary-action/25 text-primary-action">
              {meta.icon}
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight">
                {isEditing ? `Edit ${meta.title}` : meta.title}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {meta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={formData.daybookId ? String(formData.daybookId) : ""}
              onValueChange={handleSelectDaybook}
            >
              <SelectTrigger className="h-8 w-44 text-xs font-medium border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <SelectValue placeholder="Select Daybook" />
              </SelectTrigger>
              <SelectContent>
                {cashDaybooks.length > 0 ? (
                  cashDaybooks.map((db) => (
                    <SelectItem key={db.id} value={String(db.id)}>
                      {db.daybookName}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No cash daybook found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <div className="flex h-8 min-w-[130px] items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {formData.voucherNo || "Auto"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 p-4 md:p-5">
        {/* ── ROW 1: Account Details | Voucher Details | Narration ── */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* ── CARD: Account Details ── */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 px-4 py-2.5">
              <User className="h-4 w-4 text-primary-action" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Account Details
              </h2>
            </div>

            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                  Account <span className="text-rose-500">*</span>
                </Label>
                <div className="flex gap-1.5">
                  <PopupTable
                    trigger={
                      <button
                        ref={accountSearchBtnRef}
                        type="button"
                        title="Search Account (F2)"
                        className="flex flex-1 h-8 items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">
                            {formData.accountName || "Select account (F2)"}
                          </span>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                      </button>
                    }
                    placement="bottom-start"
                    apiEndpoint={API_ENDPOINTS.ACCOUNTS.BASE}
                    columns={accountPopupColumns}
                    onSelect={handleSelectVoucherAccount}
                    searchPlaceholder="Search accounts..."
                  />
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-primary-action/10 hover:text-primary-action hover:border-primary-action/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 shrink-0"
                    title="Add new account"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-100 truncate">
                      {formData.accountName || "No account selected"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {selectedAccount
                        ? `${groupMap[selectedAccount.accountGroupId] || "General"} • ${typeMap[selectedAccount.accountTypeId] || "Account"}`
                        : "Press F2 or click above to search"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <button
                      type="button"
                      onClick={() => accountSearchBtnRef.current?.click()}
                      className="text-[11px] font-medium text-primary-action hover:underline mt-0.5"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CARD: Voucher Details ── */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 px-4 py-2.5">
              <FileText className="h-4 w-4 text-primary-action" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Voucher Details
              </h2>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                    Voucher Date <span className="text-rose-500">*</span>
                  </Label>
                  <DatePicker
                    value={formData.voucherDate}
                    onChange={(d) =>
                      setFormData((prev) => ({ ...prev, voucherDate: d }))
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                    Voucher No.
                  </Label>
                  <Input
                    value={formData.voucherNo || ""}
                    disabled
                    className="h-8 text-xs font-medium bg-slate-50 dark:bg-zinc-800/50"
                    placeholder="Auto"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                  {mode === "payment" ? "Payment Type" : "Receipt Type"}{" "}
                  <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={formData.reference}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, reference: val }))
                  }
                >
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
            </div>
          </div>

          {/* ── CARD: Narration ── */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 px-4 py-2.5">
              <MessageSquareText className="h-4 w-4 text-primary-action" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Narration
              </h2>
            </div>
            <div className="p-4">
              <textarea
                rows={5}
                value={formData.remarks}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, remarks: e.target.value }))
                }
                placeholder="Enter voucher narration..."
                className="w-full rounded-md border border-slate-200 bg-transparent p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-action dark:border-zinc-800 dark:text-zinc-100 resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── ROW 2: Line Items | Summary ── */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-8 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 gap-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary-action" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  {mode === "payment" ? "Payment Details" : "Receipt Details"}
                </h3>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleAddLine}
                className="h-7 gap-1.5 bg-primary-action hover:bg-primary-action/90 text-primary-action-foreground text-xs font-medium px-3"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Line
              </Button>
            </div>

            <div
              style={{
                height: `${Math.min(420, Math.max(220, (lines.length + 2) * 38 + 48))}px`,
              }}
            >
              <DataGrid
                rowData={lines}
                columnDefs={lineColumns}
                pinnedBottomRowData={pinnedTotal}
                gridOptions={{
                  pagination: false,
                  onCellValueChanged: handleCellValueChanged,
                  singleClickEdit: true,
                  onCellKeyDown: (e: any) => {
                    if (
                      e.event instanceof KeyboardEvent &&
                      e.event.key === "Enter" &&
                      !e.node?.rowPinned
                    ) {
                      const idx = e.node?.rowIndex;
                      if (idx != null) {
                        setLines((prev) => {
                          if (
                            idx === prev.length - 1 &&
                            rowHasContent(prev[idx])
                          ) {
                            return [...prev, emptyLine()];
                          }
                          return prev;
                        });
                      }
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

            <div className="border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2">
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center gap-1.5 text-xs font-medium text-primary-action hover:text-primary-action/80"
              >
                <Plus className="h-3.5 w-3.5" />
                Add New Line
              </button>
            </div>
          </div>

          {/* ── CARD: Summary ── */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 px-4 py-2.5">
              <Receipt className="h-4 w-4 text-primary-action" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Summary
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-0">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">
                    Total Entries
                  </span>
                  <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                    {completeLines.length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">
                    Total Amount
                  </span>
                  <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                    {formatINR(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-primary-action/25 bg-primary-action/10 px-3 py-2.5">
                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  {mode === "payment" ? "Total Paid" : "Total Received"}
                </span>
                <span className="text-base font-extrabold text-primary-action tracking-tight">
                  {formatINR(totalAmount)}
                </span>
              </div>
            </div>
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
