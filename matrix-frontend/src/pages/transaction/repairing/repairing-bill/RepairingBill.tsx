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
import { AddressHelp } from "@/components/common/AddressHelp";
import { confirmAlert } from "@/components/common/AlertModal";
import { DataGrid } from "@/components/common/DataGrid";
import { DaybookReferenceModal } from "@/components/common/DaybookReferenceModal";
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
import { decodeURL, parseNumber } from "@/lib/utils";
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
  Printer,
  Receipt,
  Search,
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

export const RepairingBill: React.FC = () => {
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
      TransactionMenu.REPAIRING,
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
  const [isRefModalOpen, setIsRefModalOpen] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [placeOfSupply, setPlaceOfSupply] = useState("Gujarat (24)");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const repDaybookGroup = useMemo(
    () =>
      daybookGroups.find(
        (g: any) =>
          g.shortName === "REP" ||
          g.groupName?.toLowerCase().includes("repair"),
      ),
    [daybookGroups],
  );

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
        itemLines: existingSale.itemLines || [],
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
          tableName: "repairing-bill",
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

  const handleSelectReferenceVoucher = useCallback(
    (voucher: any, selectedItems: any[]) => {
      if (!voucher || !selectedItems || selectedItems.length === 0) return;

      const lines: SaleLineItem[] = selectedItems.map((item: any) => {
        const line: SaleLineItem = {
          id: "",
          itemId: item.itemId,
          itemName: item.itemName,
          itemCode: item.itemCode || item.tagNo || "",
          itemGroupId: item.itemGroupId || 0,
          itemGroupName: item.itemGroupName || "",
          tagNo: item.tagNo || item.itemCode || "",
          pcs: Number(item.pcs ?? 1),
          grossWt: Number(item.grossWt ?? 0),
          netWt: Number(item.netWt ?? 0),
          adjustedWt: Number(item.adjustedWt ?? 0),
          fineWt: Number(item.fineWt ?? 0),
          rate: Number(item.rate ?? 0),
          rateType: item.rateType || "",
          rateTypeId: item.rateTypeId,
          tax: item.tax || "",
          labourAmount: Number(item.labourAmount ?? 0),
          otherAmount: Number(item.otherAmount ?? 0),
          discountAmount: Number(item.discountAmount ?? 0),
          amount: Number(item.amount ?? 0),
        };
        return calculateLineItemAmount(line);
      });

      setFormData((prev) => ({
        ...prev,
        reference: voucher.voucherNo,
        accountId: voucher.accountId || prev.accountId,
        accountName: voucher.accountName || prev.accountName,
        customerPhone: voucher.customerPhone || prev.customerPhone,
        customerEmail: voucher.customerEmail || prev.customerEmail,
        customerAddress1: voucher.customerAddress || prev.customerAddress1,
        salesmanName: voucher.salesmanName || prev.salesmanName,
        advanceAmount: Number(voucher.advanceAmount || 0),
        remarks: prev.remarks || voucher.remarks || `Ref: ${voucher.voucherNo}`,
        itemLines: lines,
      }));
    },
    [],
  );

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
      const updates = getItemGroupUpdates(grp, rateTypes, "repairing-bill");
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
      alert(
        "Please take reference from a Repairing Receipt to add items before saving the bill.",
      );
      return;
    }

    if (isEditing) {
      updateMutation.mutate(
        { id: saleId, data: payload },
        {
          onSuccess: () => {
            setIsPrintModalOpen(true);
          },
          onError: (err: any) => {
            alert(err?.message || "Failed to update repairing-bill voucher");
          },
        },
      );
    } else {
      createMutation.mutate(payload as any, {
        onSuccess: (res: any) => {
          const created = res?.data || res || {};
          if (created.id) {
            setFormData((prev) => ({
              ...prev,
              id: created.id,
              voucherNo: created.voucherNo || prev.voucherNo,
            }));
          }
          setIsPrintModalOpen(true);
        },
        onError: (err: any) => {
          alert(err?.message || "Failed to create repairing-bill voucher");
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
      title: "Delete RepairingBill Voucher",
      description: `Are you sure you want to delete repairing-bill voucher ${formData.voucherNo}? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (isConfirmed) {
      deleteMutation.mutate(saleId, {
        onSuccess: () => {
          navigate(WEB_ROUTES.TRANSACTION.REPAIRING_BILL_LIST);
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
                Repairing Bill
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Create and manage your repairing-bill transactions
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
                    No repairing-bill daybook
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

              {/* Customer Phone */}
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

              <AddressHelp
                value={{
                  address1: formData.customerAddress1,
                  cityId: formData.customerCityId as number | undefined,
                  cityName: formData.customerCity,
                  areaId: formData.customerAreaId as number | undefined,
                  areaName: formData.customerArea,
                  pincode: formData.customerPincode,
                }}
                onChange={(addr) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerAddress1: addr.address1,
                    customerCityId: addr.cityId,
                    customerCity: addr.cityName,
                    customerAreaId: addr.areaId,
                    customerArea: addr.areaName,
                    customerPincode: addr.pincode,
                  }))
                }
                showAddress
                addressPlaceholder="Address Line 1"
              />
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
                  <div className="flex gap-1.5">
                    <Input
                      value={formData.reference || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          reference: e.target.value,
                        }))
                      }
                      className="h-8 text-xs flex-1"
                      placeholder="e.g. RR-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRefModalOpen(true)}
                      className="h-8 px-2.5 text-xs text-slate-600 dark:text-zinc-300 hover:text-primary-action shrink-0 gap-1"
                      title="Select Reference Voucher"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline text-[11px]">Ref</span>
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                    RepairingBill Person
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
                    placeholder="Select RepairingBill Person"
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
              {formData.reference && (
                <Badge
                  variant="outline"
                  className="text-xs font-semibold text-primary-action border-primary-action/30 bg-primary-action/5 mr-1"
                >
                  Ref: {formData.reference}
                </Badge>
              )}
              <Button
                type="button"
                size="sm"
                onClick={() => setIsRefModalOpen(true)}
                className="h-7 gap-1.5 bg-primary-action hover:bg-primary-action/90 text-primary-action-foreground text-xs font-medium px-3"
              >
                <Search className="h-3.5 w-3.5" />
                Take Reference from Repairing Receipt
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

          <div className="border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {formData.itemLines && formData.itemLines.length > 0
                ? `Items imported from reference receipt ${formData.reference ? `(${formData.reference})` : ""} with labour charges.`
                : "No items loaded. Click 'Take Reference from Repairing Receipt' to import items and labour."}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsRefModalOpen(true)}
              className="h-6 text-xs text-primary-action hover:text-primary-action/80 gap-1 font-semibold"
            >
              <Search className="h-3 w-3" />
              {formData.itemLines && formData.itemLines.length > 0
                ? "Change Reference"
                : "Select Reference"}
            </Button>
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
                    Labour Charges
                  </span>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {parseNumber(calculatedTotals.totalLabour)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">
                    Total Amount
                  </span>
                  <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                    {parseNumber(
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
                    {parseNumber(calculatedTotals.totalLineDiscount)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">
                    Taxable Amount
                  </span>
                  <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                    {parseNumber(calculatedTotals.subtotal)}
                  </span>
                </div>
                {Number(formData.advanceAmount || 0) > 0 && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50 text-emerald-600 dark:text-emerald-400">
                    <span className="text-xs">Less: Advance (Receipt)</span>
                    <span className="text-xs font-semibold">
                      - {parseNumber(formData.advanceAmount)}
                    </span>
                  </div>
                )}
                {Number(formData.cashAmount || 0) +
                  Number(formData.bankAmount || 0) +
                  Number(formData.cardAmount || 0) >
                  0 && (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50 text-blue-600 dark:text-blue-400">
                    <span className="text-xs">Less: Received Now</span>
                    <span className="text-xs font-semibold">
                      -{" "}
                      {parseNumber(
                        Number(formData.cashAmount || 0) +
                          Number(formData.bankAmount || 0) +
                          Number(formData.cardAmount || 0),
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Grand Total Highlight Row */}
              <div className="mt-3 flex items-center justify-between rounded-lg border border-primary-action/25 bg-primary-action/10 px-3 py-2.5">
                <span className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  Grand Total
                </span>
                <span className="text-base font-extrabold text-primary-action tracking-tight">
                  {parseNumber(calculatedTotals.grandTotal)}
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
                {Number(formData.advanceAmount || 0) > 0 && (
                  <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300">
                    <span>Advance from {formData.reference || "Receipt"}:</span>
                    <span className="font-bold">
                      {parseNumber(formData.advanceAmount)}
                    </span>
                  </div>
                )}

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
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                        Received Amount
                      </Label>
                      {calculatedTotals.balanceDue > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const due = Math.max(
                              0,
                              calculatedTotals.balanceDue,
                            );
                            if (paymentTab === "cash") {
                              setFormData((prev) => ({
                                ...prev,
                                cashAmount: Number(
                                  (prev.cashAmount || 0) + due,
                                ),
                              }));
                            } else if (paymentTab === "card") {
                              setFormData((prev) => ({
                                ...prev,
                                cardAmount: Number(
                                  (prev.cardAmount || 0) + due,
                                ),
                              }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                bankAmount: Number(
                                  (prev.bankAmount || 0) + due,
                                ),
                              }));
                            }
                          }}
                          className="text-[10px] text-primary-action hover:underline font-semibold"
                        >
                          Receive Full
                        </button>
                      )}
                    </div>
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
                      Balance Due
                    </Label>
                    <div className="flex h-8 items-center px-2 rounded-md border border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-850">
                      <span
                        className={`text-sm font-bold ${
                          calculatedTotals.balanceDue <= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {parseNumber(calculatedTotals.balanceDue)}
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
        onBack={() => navigate(WEB_ROUTES.TRANSACTION.REPAIRING_BILL_LIST)}
        backText="Cancel"
        onSave={handleSave}
        saveText={isEditing ? "Update" : "Save & Print"}
        isSaving={isSaving}
        isSaveDisabled={isSaving}
      />

      <PrintInvoiceModal
        open={isPrintModalOpen}
        onOpenChange={(open) => {
          setIsPrintModalOpen(open);
          if (!open && !isEditing && formData.id) {
            navigate(WEB_ROUTES.TRANSACTION.REPAIRING_BILL_LIST);
          }
        }}
        invoiceType="repairing-bill"
        badgeText="TAX INVOICE / REPAIRING BILL"
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
        partyTitle="Customer:"
        billMode={
          formData.billMode ||
          (formData.cashAmount ? "Cash" : formData.bankAmount ? "Bank" : "Cash")
        }
        staffTitle="Handled By:"
        staffName={formData.salesmanName}
        reference={formData.reference}
        rateFixType={formData.rateFixType}
        itemLines={(formData.itemLines || []).map((l: any) => ({
          itemName: l.itemName,
          itemCode: l.itemCode,
          tagNo: l.tagNo,
          purity: l.purity,
          grossWt: l.grossWt,
          netWt: l.netWt,
          rate: l.rate,
          labourAmount: l.labourAmount,
          discountAmount: l.discountAmount,
          amount: l.amount,
        }))}
        subtotal={calculatedTotals.subtotal}
        discountAmount={calculatedTotals.totalLineDiscount + couponDiscount}
        taxAmount={calculatedTotals.taxAmount}
        taxRate={Number(formData.taxRate || 3)}
        grandTotal={calculatedTotals.grandTotal}
        advanceAmount={Number(formData.advanceAmount || 0)}
        receivedAmount={
          Number(formData.cashAmount || 0) +
          Number(formData.bankAmount || 0) +
          Number(formData.cardAmount || 0)
        }
        balanceDue={calculatedTotals.balanceDue}
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
                      {parseNumber(line.amount || 0)}
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
        <DaybookReferenceModal
          isOpen={isRefModalOpen}
          onClose={() => setIsRefModalOpen(false)}
          daybookGroupId={repDaybookGroup?.id}
          daybookGroupShortName="REP"
          accountId={formData.accountId}
          title="Take Reference from Repairing Receipt"
          onSelectVoucher={handleSelectReferenceVoucher}
        />
      </Dialog>
    </div>
  );
};

export default RepairingBill;
