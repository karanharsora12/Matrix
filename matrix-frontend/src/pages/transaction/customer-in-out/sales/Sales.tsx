import { generateVoucherNo } from "@/api/daybooks";
import {
  useCreateSale,
  useDeleteSale,
  useSale,
  useUpdateSale,
  type Sale,
  type SaleLineItem,
} from "@/api/sales";
import { AccountHelp } from "@/components/common/AccountHelp";
import { confirmAlert } from "@/components/common/AlertModal";
import { DataGrid } from "@/components/common/DataGrid";
import { FormFooter } from "@/components/common/FormFooter";
import { PopupCellEditor } from "@/components/common/PopupCellEditor";
import { PrintInvoiceModal } from "@/components/common/PrintInvoiceModal";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { WEB_ROUTES } from "@/config/webRoutes";
import {
  CommonListType,
  getDaybooksByMenu,
  TransactionMenu,
} from "@/constants/enums";
import { decodeURL, fmtINR } from "@/lib/utils";
import { todayISO, toISODate } from "@/utils/date";
import {
  calculateLineItemAmount,
  calculateTransactionTotals,
  getItemGroupUpdates,
} from "@/utils/transactionCalculations";
import type { CellValueChangedEvent, ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";

// UI Components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AmountInput } from "@/components/ui/numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons
import { GridDeleteCell } from "@/components/common/GridDeleteCell";
import {
  formatNumericalValue,
  NumericalCellEditor,
  parseNumericalValue,
} from "@/components/common/NumericalCell";
import useRedux from "@/hooks/useRedux";
import {
  Coins,
  CreditCard,
  FileText,
  Paperclip,
  Plus,
  Printer,
  Receipt,
  Settings2,
  Tag,
  UploadCloud,
  User,
} from "lucide-react";

const DEFAULT_LINE_ITEM: SaleLineItem = {
  id: "",
  itemId: 0,
  itemName: "",
  itemCode: "",
  itemGroupId: 0,
  itemGroupName: "",
  tagNo: "",
  pcs: 1,
  grossWt: 0,
  netWt: 0,
  adjustedWt: 0,
  fineWt: 0,
  rate: 0,
  rateType: "",
  tax: "",
  labourAmount: 0,
  otherAmount: 0,
  discountAmount: 0,
  amount: 0,
};

export const Sales: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const tokenData = decodeURL<{ id?: number }>(params?.token);
  const saleId = tokenData?.id ? Number(tokenData.id) : 0;
  const isEditing = saleId > 0;
  const gridRef = useRef<AgGridReact>(null);

  const { data: existingSale } = useSale(isEditing ? saleId : undefined);
  const {
    rateTypes,
    commonLists,
    daybookGroups,
    daybooks: allDaybooks,
  } = useRedux("inventory");
  const measureUnits = commonLists.filter(
    (c) => c.listType === CommonListType.MEASURE_UNIT,
  );

  const itemGroupPopupColumns = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Group Name",
        field: "itemGroupName",
        minWidth: 190,
      },
      {
        headerName: "Short Name",
        field: "shortName",
        width: 100,
        valueGetter: (p) => p.data?.shortName || "-",
      },
      {
        headerName: "ID",
        field: "id",
        width: 60,
        type: "numericColumn",
      },
    ],
    [],
  );

  const itemPopupColumns = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Item Name",
        field: "itemName",
        minWidth: 220,
      },
      {
        headerName: "Short Name",
        field: "shortName",
        width: 120,
        valueGetter: (p) => p.data?.shortName || "-",
      },
      {
        headerName: "ID",
        field: "id",
        width: 65,
        type: "numericColumn",
      },
    ],
    [],
  );

  const itemCodePopupColumns = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Item Code",
        field: "itemCodeName",
        minWidth: 160,
      },
      {
        headerName: "Item",
        field: "itemName",
        minWidth: 180,
      },
      {
        headerName: "ID",
        field: "id",
        width: 65,
        type: "numericColumn",
      },
    ],
    [],
  );

  const daybooks = useMemo(() => {
    const filtered = getDaybooksByMenu(
      TransactionMenu.SALES,
      allDaybooks,
      daybookGroups,
    );
    return filtered.length > 0 ? filtered : allDaybooks;
  }, [allDaybooks, daybookGroups]);

  // Mutations
  const createMutation = useCreateSale();
  const updateMutation = useUpdateSale();
  const deleteMutation = useDeleteSale();

  const [rightTab, setRightTab] = useState<"additional" | "shipping" | "notes">(
    "additional",
  );
  const [paymentTab, setPaymentTab] = useState<
    "cash" | "bank" | "card" | "upi"
  >("cash");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [placeOfSupply, setPlaceOfSupply] = useState("Gujarat (24)");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const [formData, setFormData] = useState<Partial<Sale>>({
    voucherDate: todayISO(),
  });

  useEffect(() => {
    if (existingSale && isEditing) {
      setFormData((prev) => ({
        ...prev,
        ...existingSale,
        daybookName: existingSale.daybookName || prev.daybookName,
        accountId: existingSale.accountId,
        accountName: existingSale.accountName || prev.accountName,
        voucherDate: toISODate(existingSale.voucherDate) || todayISO(),
        dueDate: existingSale.dueDate
          ? toISODate(existingSale.dueDate)
          : undefined,
        itemLines:
          existingSale.itemLines && existingSale.itemLines.length > 0
            ? existingSale.itemLines
            : [
                {
                  ...DEFAULT_LINE_ITEM,
                },
              ],
      }));
    }
  }, [existingSale, isEditing, daybooks]);

  // Calculations
  const calculatedTotals = useMemo(() => {
    return calculateTransactionTotals(
      formData.itemLines || [],
      Number(formData.taxRate || 3),
      couponDiscount,
      formData,
    );
  }, [
    formData.itemLines,
    formData.taxRate,
    couponDiscount,
    formData.cashAmount,
    formData.bankAmount,
    formData.cardAmount,
    formData.advanceAmount,
    formData.urdAmount,
    formData.salesReturnAmount,
    formData.kasarAmount,
    formData.giftVoucherAmount,
  ]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      subtotal: calculatedTotals.subtotal,
      taxAmount: calculatedTotals.taxAmount,
      roundOff: calculatedTotals.roundOff,
      grandTotal: calculatedTotals.grandTotal,
      discountAmount: calculatedTotals.totalLineDiscount + couponDiscount,
    }));
  }, [calculatedTotals, couponDiscount]);

  const handleSelectDaybook = useCallback(
    async (val: string) => {
      const dbId = Number(val);
      const db = daybooks.find((d) => d.id === dbId);
      setFormData((prev) => ({
        ...prev,
        daybookId: dbId,
        daybookName: db?.daybookName || prev.daybookName,
      }));

      try {
        const resp = await generateVoucherNo({
          daybookId: dbId,
          daybookGroupId: db?.daybookGroupId,
          tableName: "sales",
        });
        if (resp.success && resp.data?.voucherNo) {
          setFormData((prev) => ({
            ...prev,
            voucherNo: resp.data.voucherNo,
            srNo: resp.data.srNo,
          }));
        }
      } catch (err) {
        console.error("Failed to generate voucher number from endpoint:", err);
        const prefix = db?.voucherPrefix || "INV";
        setFormData((prev) => ({
          ...prev,
          voucherNo: `${prefix}-1`,
        }));
      }
    },
    [daybooks],
  );

  useEffect(() => {
    if (!isEditing && daybooks.length > 0 && !formData.daybookId) {
      const defaultDb = daybooks[0];
      handleSelectDaybook(String(defaultDb.id));
    }
  }, [isEditing, daybooks, formData.daybookId, handleSelectDaybook]);

  const handleLineItemChange = useCallback(
    (index: number, field: keyof SaleLineItem, value: any) => {
      setFormData((prev) => {
        const updatedLines = [...(prev.itemLines || [])];
        if (!updatedLines[index]) return prev;
        const current = { ...updatedLines[index], [field]: value };
        const updatedLine = calculateLineItemAmount(current, field);
        updatedLines[index] = updatedLine;
        return { ...prev, itemLines: updatedLines };
      });
    },
    [],
  );

  const applyLineItemUpdates = useCallback(
    (index: number, updates: Partial<SaleLineItem>) => {
      setFormData((prev) => {
        const updatedLines = [...(prev.itemLines || [])];
        if (!updatedLines[index]) return prev;

        let current = { ...updatedLines[index], ...updates };
        current = calculateLineItemAmount(current);
        updatedLines[index] = current;
        return { ...prev, itemLines: updatedLines };
      });
    },
    [],
  );

  const handleAddLineItem = useCallback(() => {
    const newLine: SaleLineItem = {
      ...DEFAULT_LINE_ITEM,
    };
    setFormData((prev) => ({
      ...prev,
      itemLines: [...(prev.itemLines || []), newLine],
    }));
  }, []);

  const handleDeleteLineItem = useCallback((index: number) => {
    setFormData((prev) => {
      const lines = prev.itemLines || [];
      return {
        ...prev,
        itemLines: lines.filter((_, i) => i !== index),
      };
    });
  }, []);

  const handleCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {
      if (event.node?.rowPinned) return;
      const rowIndex = event.rowIndex;
      if (rowIndex == null || rowIndex < 0) return;

      const field = event.colDef.field as keyof SaleLineItem;
      let value = event.newValue;

      if (field === "rateType") {
        const rt = rateTypes.find((r) => r.name === value);
        applyLineItemUpdates(rowIndex, {
          rateType: value,
          rateTypeId: rt ? rt.id : undefined,
        });
        return;
      }

      if (
        [
          "pcs",
          "grossWt",
          "netWt",
          "rate",
          "labourAmount",
          "otherAmount",
          "discountAmount",
        ].includes(field as string)
      ) {
        const parsed = parseFloat(String(value ?? ""));
        value = isNaN(parsed) ? 0 : parsed;
      }

      handleLineItemChange(rowIndex, field, value);
    },
    [handleLineItemChange, applyLineItemUpdates, rateTypes],
  );

  const columnDefs = useMemo<ColDef[]>(() => {
    return [
      {
        field: "index",
        headerName: "#",
        width: 50,
        pinned: "left",
        sortable: false,
        filter: false,
        resizable: false,
        valueGetter: (params) =>
          params.node?.rowPinned ? "" : (params.node?.rowIndex ?? 0) + 1,
      },
      {
        headerName: "Item Group",
        field: "itemGroupName",
        minWidth: 170,
        width: 180,
        editable: (p) => !p.node?.rowPinned,
        cellEditor: PopupCellEditor,
        cellEditorParams: {
          apiEndpoint: API_ENDPOINTS.INVENTORY.ITEM_GROUPS,
          columns: itemGroupPopupColumns,
          onItemSelect: (item: any, rowIndex: number) => {
            handleSelectItemGroupForRow(rowIndex, item);
          },
          searchPlaceholder: "Search Item Group...",
          width: 720,
          height: 360,
        },
        valueGetter: (p) =>
          p.node?.rowPinned ? "TOTAL" : p.data?.itemGroupName || "",
      },
      {
        headerName: "Items",
        field: "itemName",
        minWidth: 180,
        editable: (p) => !p.node?.rowPinned,
        cellEditor: PopupCellEditor,
        cellEditorParams: {
          apiEndpoint: API_ENDPOINTS.INVENTORY.ITEMS,
          columns: itemPopupColumns,
          onItemSelect: (item: any, rowIndex: number) => {
            handleSelectItemForRow(rowIndex, item);
          },
          searchPlaceholder: "Search Item...",
          width: 720,
          height: 360,
        },
        valueGetter: (p) => (p.node?.rowPinned ? "" : p.data?.itemName || ""),
      },
      {
        headerName: "Item Code",
        field: "itemCode",
        minWidth: 140,
        width: 150,
        editable: (p) => !p.node?.rowPinned,
        cellEditor: PopupCellEditor,
        cellEditorParams: {
          apiEndpoint: API_ENDPOINTS.INVENTORY.ITEM_CODES,
          columns: itemCodePopupColumns,
          onItemSelect: (itemCodeObj: any, rowIndex: number) => {
            handleSelectItemCodeForRow(rowIndex, itemCodeObj);
          },
          searchPlaceholder: "Search Item Code...",
          width: 650,
          height: 360,
        },
        valueGetter: (p) => (p.node?.rowPinned ? "" : p.data?.itemCode || ""),
      },
      {
        headerName: "Pcs",
        field: "pcs",
        width: 80,
        editable: (p) => !p.node?.rowPinned,
        cellEditor: NumericalCellEditor,
        cellEditorParams: {
          type: "integer",
          decimals: 0,
        },
        cellClass: "ag-right-aligned-cell",
        headerClass: "ag-right-aligned-header",
        valueFormatter: (params) =>
          formatNumericalValue(
            params.value,
            { type: "integer", decimals: 0 },
            Boolean(params.node?.rowPinned),
          ),
        valueParser: (params) => {
          if (params.newValue === "" || params.newValue == null) return 1;
          const n = parseInt(params.newValue, 10);
          return isNaN(n) ? 1 : n;
        },
      },
      {
        headerName: "Gross Wt.",
        field: "grossWt",
        width: 110,
        editable: (p) => !p.node?.rowPinned,
        cellEditor: NumericalCellEditor,
        cellEditorParams: {
          type: "weight",
          decimals: 3,
        },
        cellClass: "ag-right-aligned-cell",
        headerClass: "ag-right-aligned-header",
        valueFormatter: (params) =>
          formatNumericalValue(
            params.value,
            { type: "weight", decimals: 3 },
            Boolean(params.node?.rowPinned),
          ),
        valueParser: (params) =>
          parseNumericalValue(params.newValue, { type: "weight", decimals: 3 }),
      },
      {
        headerName: "Net Wt.",
        field: "netWt",
        width: 110,
        editable: false,
        cellClass: "ag-right-aligned-cell",
        headerClass: "ag-right-aligned-header",
        valueFormatter: (params) =>
          formatNumericalValue(
            params.value,
            { type: "weight", decimals: 3 },
            Boolean(params.node?.rowPinned),
          ),
      },
      {
        headerName: "Rate",
        field: "rate",
        width: 115,
        editable: (p) => !p.node?.rowPinned,
        cellEditor: NumericalCellEditor,
        cellEditorParams: {
          type: "amount",
          decimals: 2,
        },
        cellClass: "ag-right-aligned-cell",
        headerClass: "ag-right-aligned-header",
        valueFormatter: (params) =>
          formatNumericalValue(
            params.value,
            { type: "amount", decimals: 2 },
            Boolean(params.node?.rowPinned),
          ),
        valueParser: (params) =>
          parseNumericalValue(params.newValue, { type: "amount", decimals: 2 }),
      },
      {
        headerName: "Rate Type",
        field: "rateType",
        width: 140,
        editable: (p) => !p.node?.rowPinned,
        cellEditor: PopupCellEditor,
        cellEditorParams: {
          tableData: rateTypes,
          columns: [
            {
              headerName: "Rate Type",
              field: "name",
            },
          ],
          onItemSelect: (rt: any, rowIndex: number) => {
            const rtName = typeof rt === "object" ? rt?.name : rt;
            const matchedRt = rateTypes.find(
              (r) => r.name === rtName || r.id === rt?.id,
            );
            applyLineItemUpdates(rowIndex, {
              rateType: rtName,
              rateTypeId: matchedRt ? matchedRt.id : undefined,
            });
          },
          searchPlaceholder: "Search Rate Type...",
          width: 320,
          height: 220,
        },
      },
      {
        headerName: "Discount",
        field: "discountAmount",
        width: 115,
        editable: (p) => !p.node?.rowPinned,
        cellEditor: NumericalCellEditor,
        cellEditorParams: {
          type: "amount",
          decimals: 2,
        },
        cellClass: "ag-right-aligned-cell",
        headerClass: "ag-right-aligned-header",
        valueFormatter: (params) =>
          formatNumericalValue(
            params.value,
            { type: "amount", decimals: 2 },
            Boolean(params.node?.rowPinned),
          ),
        valueParser: (params) =>
          parseNumericalValue(params.newValue, { type: "amount", decimals: 2 }),
      },
      {
        headerName: "Amount",
        field: "amount",
        width: 135,
        cellEditor: NumericalCellEditor,
        cellEditorParams: {
          type: "amount",
          decimals: 2,
        },
        cellClass: "ag-right-aligned-cell",
        headerClass: "ag-right-aligned-header",
        valueFormatter: (params) =>
          formatNumericalValue(
            params.value,
            { type: "amount", decimals: 2 },
            Boolean(params.node?.rowPinned),
          ),
        editable: false,
      },
      {
        headerName: "",
        width: 60,
        pinned: "right",
        cellRenderer: (params) => {
          if (params.node?.rowPinned) return null;
          return (
            <GridDeleteCell
              {...params}
              onDelete={() => {
                handleDeleteLineItem(params.node?.rowIndex);
              }}
            />
          );
        },
      },
    ];
  }, [
    handleDeleteLineItem,
    rateTypes,
    itemGroupPopupColumns,
    itemPopupColumns,
    itemCodePopupColumns,
  ]);

  const pinnedBottomRowData = useMemo(() => {
    return [
      {
        index: "TOTAL",
        itemName: "",
        pcs: calculatedTotals.pcs,
        uom: "",
        grossWt: calculatedTotals.grossWt.toFixed(3),
        netWt: calculatedTotals.netWt.toFixed(3),
        rate: null,
        rateType: "",
        discountAmount: calculatedTotals.totalLineDiscount,
        tax: "",
        amount: calculatedTotals.subtotal,
      },
    ];
  }, [calculatedTotals]);

  const handleSelectCustomer = useCallback((account: any) => {
    if (account) {
      setFormData((prev) => ({
        ...prev,
        accountId: account.id,
        accountName:
          account.accountName ||
          `${account.firstName || ""} ${account.lastName || ""}`.trim(),
        customerPhone:
          account.phone ||
          account.mobile ||
          account.userName ||
          prev.customerPhone,
        customerEmail: account.email || prev.customerEmail,
      }));
    }
  }, []);

  const handleSelectItemGroupForRow = useCallback(
    (rowIndex: number, grp: any) => {
      if (!grp) return;
      const updates = getItemGroupUpdates(grp, rateTypes, "sales");
      applyLineItemUpdates(rowIndex, updates);
    },
    [rateTypes, applyLineItemUpdates],
  );

  const handleSelectItemForRow = useCallback((rowIndex: number, item: any) => {
    setFormData((prev) => {
      const lines = [...(prev.itemLines || [])];
      if (!lines[rowIndex]) return prev;
      const current = { ...lines[rowIndex] };
      current.itemId = item.id;
      current.itemName = item.itemName;
      lines[rowIndex] = current;
      return { ...prev, itemLines: lines };
    });
  }, []);

  const handleSelectItemCodeForRow = useCallback(
    (rowIndex: number, itemCodeObj: any) => {
      setFormData((prev) => {
        const lines = [...(prev.itemLines || [])];
        if (!lines[rowIndex]) return prev;
        const current = { ...lines[rowIndex] };
        current.itemCode = itemCodeObj.itemCodeName;
        current.tagNo = itemCodeObj.itemCodeName;
        if (itemCodeObj.itemId) {
          current.itemId = itemCodeObj.itemId;
          current.itemName = itemCodeObj.itemName;
        }
        lines[rowIndex] = current;
        return { ...prev, itemLines: lines };
      });
    },
    [],
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = async () => {
    if (!formData.voucherNo?.trim()) {
      alert("Please provide a Voucher / Bill Number.");
      return;
    }

    const payload: Partial<Sale> = {
      ...formData,
      itemLines: (formData.itemLines || [])
        .filter((line) => line.itemId && line.itemId > 0)
        .map((line) => {
          const taxable = Math.max(
            0,
            (line.amount || 0) - (line.discountAmount || 0),
          );
          const taxPct = Number(formData.taxRate || 3);
          const withTax = taxable * (1 + taxPct / 100);
          return {
            ...line,
            qty: line.pcs ?? 1,
            taxableAmount: taxable,
            amountWithTax: Number(withTax.toFixed(2)),
          };
        }),
    };

    if (payload.itemLines.length === 0) {
      alert("Please add at least one valid item to save the sale.");
      return;
    }

    if (isEditing) {
      updateMutation.mutate(
        { id: saleId, data: payload },
        {
          onSuccess: () => {
            navigate(WEB_ROUTES.TRANSACTION.SALES_LIST);
          },
          onError: (err: any) => {
            alert(err?.message || "Failed to update sales voucher");
          },
        },
      );
    } else {
      createMutation.mutate(payload as any, {
        onSuccess: () => {
          navigate(WEB_ROUTES.TRANSACTION.SALES_LIST);
        },
        onError: (err: any) => {
          alert(err?.message || "Failed to create sales voucher");
        },
      });
    }
  };

  const handleClear = () => {
    const defaultDb = daybooks[0];
    const defaultDbId = defaultDb?.id || 1;
    setFormData({});
    setCouponDiscount(0);
    handleSelectDaybook(String(defaultDbId));
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    const isConfirmed = await confirmAlert({
      title: "Delete Sales Voucher",
      description: `Are you sure you want to delete sales voucher ${formData.voucherNo}? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (isConfirmed) {
      deleteMutation.mutate(saleId, {
        onSuccess: () => {
          navigate(WEB_ROUTES.TRANSACTION.SALES_LIST);
        },
      });
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-[#f5f6fa] dark:bg-zinc-950">
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: cart icon + title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-action/10 border border-primary-action/25">
              <Receipt className="h-5 w-5 text-primary-action" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-zinc-100 leading-tight">
                Sales Invoice
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Create and manage your sales transactions
              </p>
            </div>
          </div>

          {/* Right: Invoice type selector + invoice number + settings */}
          <div className="flex items-center gap-2">
            <Select
              value={formData.daybookId ? String(formData.daybookId) : ""}
              onValueChange={handleSelectDaybook}
            >
              <SelectTrigger className="h-8 w-36 text-xs font-medium border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <SelectValue placeholder="Invoice" />
              </SelectTrigger>
              <SelectContent>
                {daybooks.length > 0 ? (
                  daybooks.map((db) => (
                    <SelectItem key={db.id} value={String(db.id)}>
                      {db.daybookName}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No sales daybook
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <div className="flex h-8 min-w-[130px] items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {formData.voucherNo || "INV-2025-0001"}
            </div>

            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 p-4 md:p-5">
        {/* ROW 1: Customer Details | Invoice Details | Additional Info Tabs */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* CARD: Customer Details (4 cols) */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 px-4 py-2.5">
              <User className="h-4 w-4 text-primary-action" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Customer Details
              </h2>
            </div>

            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                  Customer <span className="text-rose-500">*</span>
                </Label>
                <AccountHelp
                  accountName={formData.accountName}
                  value={formData.accountId}
                  placeholder="Walk-in Customer"
                  searchPlaceholder="Search customer..."
                  onSelect={handleSelectCustomer}
                  showAddButton
                />
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-850">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-100 truncate">
                      {formData.accountName || "Walk-in Customer"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {formData.customerCity || "City"},{" "}
                      {formData.customerState || "State"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      GST:{" "}
                      {formData.customerGstNo
                        ? formData.customerGstNo
                        : "Unregistered"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Phone & City */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                    Phone
                  </Label>
                  <Input
                    value={formData.customerPhone || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerPhone: e.target.value,
                      }))
                    }
                    placeholder="9876543210"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                    City
                  </Label>
                  <Input
                    value={formData.customerCity || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerCity: e.target.value,
                      }))
                    }
                    placeholder="Ahmedabad"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                  Address
                </Label>
                <Input
                  value={formData.customerAddress1 || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customerAddress1: e.target.value,
                    }))
                  }
                  placeholder="Address Line 1"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* CARD: Invoice Details (4 cols) */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 px-4 py-2.5">
              <FileText className="h-4 w-4 text-primary-action" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Invoice Details
              </h2>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                    Invoice Date <span className="text-rose-500">*</span>
                  </Label>
                  <DatePicker
                    value={formData.voucherDate}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, voucherDate: val }))
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                    Due Date
                  </Label>
                  <DatePicker
                    value={formData.dueDate}
                    onChange={(val) =>
                      setFormData((prev) => ({ ...prev, dueDate: val }))
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                    Invoice No.
                  </Label>
                  <Input
                    value={formData.voucherNo || ""}
                    disabled
                    className="h-8 text-xs font-medium bg-slate-50 dark:bg-zinc-800/50"
                    placeholder="INV-2025-0001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                    Reference No.
                  </Label>
                  <Input
                    value={formData.reference || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        reference: e.target.value,
                      }))
                    }
                    className="h-8 text-xs"
                    placeholder="e.g. PO/Ref No."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                    Sales Person
                  </Label>
                  <Input
                    value={formData.salesmanName || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        salesmanName: e.target.value,
                      }))
                    }
                    className="h-8 text-xs"
                    placeholder="Select Sales Person"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CARD: Additional Info / Shipping / Notes Tabs (4 cols) */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4 overflow-hidden">
            <div className="flex items-center border-b border-slate-100 dark:border-zinc-800 px-4">
              {(["additional", "shipping", "notes"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRightTab(tab)}
                  className={`relative py-2.5 px-0 mr-5 text-xs font-medium transition-colors ${
                    rightTab === tab
                      ? "text-primary-action"
                      : "text-slate-500 hover:text-slate-700 dark:text-zinc-400"
                  }`}
                >
                  {tab === "additional"
                    ? "Additional Info"
                    : tab === "shipping"
                      ? "Shipping"
                      : "Notes"}
                  {rightTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary-action" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-4">
              {rightTab === "additional" && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                      Place of Supply
                    </Label>
                    <Select
                      value={placeOfSupply}
                      onValueChange={setPlaceOfSupply}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gujarat (24)">
                          Gujarat (24)
                        </SelectItem>
                        <SelectItem value="Maharashtra (27)">
                          Maharashtra (27)
                        </SelectItem>
                        <SelectItem value="Delhi (07)">Delhi (07)</SelectItem>
                        <SelectItem value="Rajasthan (08)">
                          Rajasthan (08)
                        </SelectItem>
                        <SelectItem value="Karnataka (29)">
                          Karnataka (29)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {rightTab === "shipping" && (
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-500">
                      Customer Email
                    </Label>
                    <Input
                      type="email"
                      value={formData.customerEmail || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerEmail: e.target.value,
                        }))
                      }
                      placeholder="customer@example.com"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-500">
                      Delivery Landmark
                    </Label>
                    <Input
                      value={formData.customerAddress2 || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerAddress2: e.target.value,
                        }))
                      }
                      placeholder="Near City Center"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="deliveryPendingCheck"
                      checked={formData.deliveryPending || false}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          deliveryPending: e.target.checked,
                        }))
                      }
                      className="h-3.5 w-3.5 rounded accent-primary-action"
                    />
                    <Label
                      htmlFor="deliveryPendingCheck"
                      className="text-xs cursor-pointer"
                    >
                      Pending Store Delivery
                    </Label>
                  </div>
                </div>
              )}

              {rightTab === "notes" && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-500">
                    Voucher Notes
                  </Label>
                  <textarea
                    rows={4}
                    value={formData.remarks || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        remarks: e.target.value,
                      }))
                    }
                    placeholder="Enter any notes or terms..."
                    className="w-full rounded-md border border-slate-200 bg-transparent p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-action dark:border-zinc-800 dark:text-zinc-100 resize-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ITEM DETAILS GRID */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 gap-2">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary-action" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Item Details
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                onClick={handleAddLineItem}
                className="h-7 gap-1.5 bg-primary-action hover:bg-primary-action/90 text-primary-action-foreground text-xs font-medium px-3"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </Button>
            </div>
          </div>

          <div className="h-80">
            <DataGrid
              ref={gridRef}
              rowData={formData.itemLines || []}
              columnDefs={columnDefs}
              pinnedBottomRowData={pinnedBottomRowData}
              gridOptions={{
                pagination: false,
                singleClickEdit: true,
                onCellValueChanged: handleCellValueChanged,
                defaultColDef: {
                  filter: false,
                  floatingFilter: false,
                  sortable: false,
                  resizable: true,
                },
              }}
            />
          </div>

          <div className="border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2">
            <button
              type="button"
              onClick={handleAddLineItem}
              className="flex items-center gap-1.5 text-xs font-medium text-primary-action hover:text-primary-action/80"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add New Row</span>
            </button>
          </div>
        </div>

        {/* ROW 3: Remarks | Summary | Payment Details */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* CARD: Remarks (4 cols) */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 px-4 py-2.5">
              <FileText className="h-4 w-4 text-primary-action" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Remarks
              </h3>
            </div>
            <div className="p-4">
              <textarea
                rows={6}
                value={formData.remarks || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, remarks: e.target.value }))
                }
                placeholder="Enter remarks..."
                className="w-full rounded-md border border-slate-200 bg-transparent p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-action dark:border-zinc-800 dark:text-zinc-100 resize-none"
              />
            </div>
          </div>

          {/* CARD: Summary (4 cols) */}
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
                    Total Items
                  </span>
                  <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                    {formData.itemLines?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">
                    Total Quantity
                  </span>
                  <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                    {calculatedTotals.pcs}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">
                    Total Amount
                  </span>
                  <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                    {fmtINR(
                      calculatedTotals.subtotal +
                        calculatedTotals.totalLineDiscount,
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">
                    Total Discount
                  </span>
                  <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                    {fmtINR(calculatedTotals.totalLineDiscount)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">
                    Taxable Amount
                  </span>
                  <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                    {fmtINR(calculatedTotals.subtotal)}
                  </span>
                </div>
              </div>

              {/* Grand Total Highlight Row */}
              <div className="mt-3 flex items-center justify-between rounded-lg border border-primary-action/25 bg-primary-action/10 px-3 py-2.5">
                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  Grand Total
                </span>
                <span className="text-base font-extrabold text-primary-action tracking-tight">
                  {fmtINR(calculatedTotals.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* CARD: Payment Details + Attachments (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 px-4 py-2.5">
                <CreditCard className="h-4 w-4 text-primary-action" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Payment Details
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                    Payment Type
                  </span>
                  <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-850">
                    {(["cash", "bank", "card", "upi"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setPaymentTab(tab)}
                        className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                          paymentTab === tab
                            ? "bg-primary-action text-primary-action-foreground shadow-sm"
                            : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {tab === "cash"
                          ? "Cash"
                          : tab === "bank"
                            ? "Bank"
                            : tab === "card"
                              ? "Card"
                              : "UPI"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                      Received Amount
                    </Label>
                    <AmountInput
                      value={
                        paymentTab === "cash"
                          ? (formData.cashAmount ?? 0)
                          : paymentTab === "card"
                            ? (formData.cardAmount ?? 0)
                            : (formData.bankAmount ?? 0)
                      }
                      onChange={(val) => {
                        if (paymentTab === "cash")
                          setFormData((prev) => ({ ...prev, cashAmount: val }));
                        else if (paymentTab === "card")
                          setFormData((prev) => ({ ...prev, cardAmount: val }));
                        else
                          setFormData((prev) => ({ ...prev, bankAmount: val }));
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                      Balance
                    </Label>
                    <div className="flex h-8 items-center px-2 rounded-md border border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-850">
                      <span
                        className={`text-sm font-bold ${
                          calculatedTotals.balanceDue <= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {fmtINR(calculatedTotals.balanceDue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 px-4 py-2.5">
                <Paperclip className="h-4 w-4 text-primary-action" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Attachments
                </h3>
              </div>
              <div className="p-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadedFiles((prev) => [
                        ...prev,
                        ...Array.from(e.target.files!).map((f) => f.name),
                      ]);
                    }
                  }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 py-4 text-center hover:border-primary-action/40 hover:bg-primary-action/10 transition-colors dark:border-zinc-700 dark:hover:border-primary-action"
                >
                  <UploadCloud className="h-6 w-6 text-slate-400 dark:text-zinc-500 mb-1" />
                  <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                    Drag & drop files here or{" "}
                    <span className="text-primary-action">click to upload</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    PDF, Image (Max 5MB)
                  </p>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadedFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-zinc-400"
                      >
                        <Paperclip className="h-3 w-3" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <FormFooter
        showVoucherNavigation={true}
        onTagPrint={() => setIsTagModalOpen(true)}
        tagPrintText="Tag Print"
        onPrint={() => setIsPrintModalOpen(true)}
        printText="Print Invoice"
        onDelete={isEditing ? handleDelete : undefined}
        deleteText="Delete"
        onClear={handleClear}
        clearText="Clear"
        onBack={() => navigate(WEB_ROUTES.TRANSACTION.SALES_LIST)}
        backText="Cancel"
        onSave={handleSave}
        saveText={isEditing ? "Update" : "Save & Print"}
        isSaving={isSaving}
        isSaveDisabled={isSaving}
      />

      <PrintInvoiceModal
        open={isPrintModalOpen}
        onOpenChange={setIsPrintModalOpen}
        invoiceType="sales"
        voucherId={formData.id}
        voucherNo={formData.voucherNo}
        voucherDate={formData.voucherDate}
        party={{
          name: formData.accountName || "Walk-in Customer",
          phone: formData.customerPhone,
          address: formData.customerAddress1,
          city: formData.customerCity,
          state: formData.customerState,
          gstNo: formData.customerGstNo,
          panNo: formData.customerPanNo,
        }}
        billMode={formData.billMode}
        staffTitle="Salesman:"
        staffName={formData.salesmanName}
        reference={formData.reference}
        rateFixType={formData.rateFixType}
        itemLines={formData.itemLines}
        subtotal={calculatedTotals.subtotal}
        discountAmount={calculatedTotals.totalLineDiscount}
        taxAmount={calculatedTotals.taxAmount}
        taxRate={Number(formData.taxRate || 3)}
        grandTotal={calculatedTotals.grandTotal}
        remarks={formData.remarks}
      />

      <Dialog open={isTagModalOpen} onOpenChange={setIsTagModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 border border-amber-200">
                <Tag className="h-3.5 w-3.5 text-amber-700" />
              </div>
              <span className="text-sm font-bold text-slate-900">
                Print Jewellery Tags
              </span>
              <Badge variant="outline" className="text-[9px] font-mono ml-1">
                {formData.itemLines?.length || 0} items
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
            <div className="space-y-1.5">
              {(formData.itemLines || []).map((line, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-amber-200 bg-white px-3 py-2 hover:bg-amber-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-100 text-[10px] font-bold text-amber-700">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {line.tagNo || `TAG-${i + 1}`}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">
                        {line.itemName || "Item"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <div className="text-right text-[10px] text-slate-500 tabular-nums">
                      <span>GW: {Number(line.grossWt || 0).toFixed(3)}</span>
                      <span className="mx-1">&bull;</span>
                      <span>NW: {Number(line.netWt || 0).toFixed(3)}</span>
                    </div>
                    <span className="text-xs font-bold text-amber-700 tabular-nums">
                      {fmtINR(line.amount || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="px-5 py-3 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTagModalOpen(false)}
              className="h-8 border-slate-200 hover:bg-slate-100 text-slate-700 text-xs"
            >
              Close
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md shadow-amber-200 text-xs"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="font-semibold">Print Tags</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
