import { useAccountMasterData, useAccounts } from "@/api/accounts";
import {
  generateVoucherNo,
  useDaybookGroups,
  useDaybooks,
} from "@/api/daybooks";
import { useItemGroups, useItems } from "@/api/inventory";
import {
  useCreatePurchase,
  useDeletePurchase,
  usePurchase,
  usePurchases,
  useUpdatePurchase,
  type Purchase as PurchaseData,
  type PurchaseLineItem,
} from "@/api/purchase";
import { confirmAlert } from "@/components/common/AlertModal";
import { DataGrid } from "@/components/common/DataGrid";
import { FormFooter } from "@/components/common/FormFooter";
import { PopupCellEditor } from "@/components/common/PopupCellEditor";
import { PopupTable } from "@/components/common/PopupTable";
import { SelectCellEditor } from "@/components/common/SelectCellEditor";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { WEB_ROUTES } from "@/config/webRoutes";
import {
  CommonListType,
  TransactionMenu,
  getDaybooksByMenu,
} from "@/constants/enums";
import { buildRoute, decodeURL, encodeURL } from "@/lib/utils";
import {
  calculateLineItemAmount,
  calculateTransactionTotals,
  getItemGroupUpdates,
} from "@/utils/transactionCalculations";
import type {
  CellValueChangedEvent,
  ColDef,
  ICellRendererParams,
} from "ag-grid-community";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import type { RootState } from "@/store";
import {
  Barcode,
  Building2,
  Calendar,
  CheckCircle2,
  Coins,
  CreditCard,
  FileText,
  Package,
  Percent,
  Plus,
  Printer,
  Receipt,
  Search,
  Sparkles,
  Tag,
  Truck,
  UploadCloud,
  User,
  Wallet,
} from "lucide-react";
import { useSelector } from "react-redux";

const BILL_MODES = [
  "Debit Memo",
  "Cash",
  "Bank Transfer / UPI",
  "Credit Card",
  "Split Payment",
];

const DEFAULT_LINE_ITEM: PurchaseLineItem = {
  id: "temp-1",
  itemId: 0,
  itemName: "",
  itemCode: "",
  itemGroupId: 0,
  itemGroupName: "",
  tagNo: "",
  pcs: 1,
  uom: "GMS",
  grossWt: 0,
  netWt: 0,
  adjustedWt: 0,
  fineWt: 0,
  rate: 0,
  rateType: "",
  tax: "3%",
  labourAmount: 0,
  otherAmount: 0,
  discountAmount: 0,
  amount: 0,
};

export const Purchase: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const tokenData = decodeURL<{ id?: number }>(params?.token);
  const purchaseId = tokenData?.id ? Number(tokenData.id) : 0;
  const isEditing = purchaseId > 0;
  const gridRef = useRef<AgGridReact>(null);

  // Master Data Queries
  const { data: purchasesListResp } = usePurchases();
  const { data: daybooksResp } = useDaybooks();
  const { data: daybookGroupsResp } = useDaybookGroups();
  const { data: accountsResp } = useAccounts();
  const { data: accountMasterResp } = useAccountMasterData();
  const { data: itemsResp } = useItems();
  const { data: itemGroupsResp } = useItemGroups();
  const { data: existingPurchase, isLoading: isLoadingPurchase } = usePurchase(
    isEditing ? purchaseId : undefined,
  );
  const { rateTypes, commonLists } = useSelector(
    (state: RootState) => state.inventory,
  );
  const measureUnits = commonLists.filter(
    (c) => c.listType === CommonListType.MEASURE_UNIT,
  );

  const allDaybooks = daybooksResp?.data || [];
  const daybookGroups = daybookGroupsResp?.data || [];
  const accounts = accountsResp?.data || [];
  const items = itemsResp?.data || [];
  const itemGroups = itemGroupsResp?.data || [];
  const allPurchases = purchasesListResp?.data || [];

  const groupMap = useMemo(() => {
    const map: Record<number, string> = {};
    accountMasterResp?.accountGroups?.forEach((g) => {
      map[g.id] = g.name;
    });
    return map;
  }, [accountMasterResp]);

  const typeMap = useMemo(() => {
    const map: Record<number, string> = {};
    accountMasterResp?.accountTypes?.forEach((t) => {
      map[t.id] = t.name;
    });
    return map;
  }, [accountMasterResp]);

  const accountDropdownColumns = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Supplier Name",
        field: "accountName",
        minWidth: 200,
        flex: 1,
        valueGetter: (p) =>
          p.data?.accountName ||
          `${p.data?.firstName || ""} ${p.data?.lastName || ""}`.trim() ||
          "-",
      },
      {
        headerName: "ID",
        field: "id",
        type: "numericColumn",
        width: 65,
      },
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
        headerName: "Mobile No.",
        field: "phone",
        valueGetter: (p) => p.data?.mobile || p.data?.phone || "-",
        minWidth: 120,
        width: 130,
      },
      {
        headerName: "Account Type",
        field: "accountTypeId",
        valueGetter: (p) => typeMap[p.data?.accountTypeId] || "Supplier",
        minWidth: 140,
        width: 150,
      },
    ],
    [groupMap, typeMap],
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

  // Filter daybooks for PURCHASE menu only
  const daybooks = useMemo(() => {
    const filtered = getDaybooksByMenu(
      TransactionMenu.PURCHASE,
      allDaybooks,
      daybookGroups,
    );
    return filtered.length > 0 ? filtered : allDaybooks;
  }, [allDaybooks, daybookGroups]);

  // Mutations
  const createMutation = useCreatePurchase();
  const updateMutation = useUpdatePurchase();
  const deleteMutation = useDeletePurchase();

  const [supplierTab, setSupplierTab] = useState<
    "general" | "shipping" | "kyc"
  >("general");
  const [settlementTab, setSettlementTab] = useState<"receipt" | "remarks">(
    "receipt",
  );
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [taxMode, setTaxMode] = useState<"GST" | "IGST">("GST");
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  const [formData, setFormData] = useState<Partial<PurchaseData>>({
    voucherNo: "",
    voucherDate: new Date().toISOString().slice(0, 10),
    daybookId: undefined,
    daybookName: "",
    reference: "",
    remarks: "",
    purchaserName: "",
    billMode: "Debit Memo",
    supplierPhone: "",
    supplierAltPhone: "",
    supplierAddress1: "",
    supplierAddress2: "",
    supplierCity: "",
    supplierPincode: "",
    supplierState: "",
    supplierGstNo: "",
    supplierPanNo: "",
    supplierAadharNo: "",
    supplierEmail: "",
    itemLines: [{ ...DEFAULT_LINE_ITEM, id: `line-${Date.now()}` }],
    subtotal: 0,
    discountRate: 0,
    discountAmount: 0,
    taxRate: 3,
    taxAmount: 0,
    roundOff: 0,
    grandTotal: 0,
    cashAmount: 0,
    bankAmount: 0,
    bankName: "",
    cardAmount: 0,
    cardCommission: 0,
    advanceAmount: 0,
    urdAmount: 0,
    purchaseReturnAmount: 0,
    schemeAmount: 0,
    giftVoucherAmount: 0,
    kasarAmount: 0,
    tdsAmount: 0,
    rateFixType: "Fix",
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    deliveryPending: false,
    isActive: true,
  });

  useEffect(() => {
    if (existingPurchase && isEditing) {
      setFormData({
        ...existingPurchase,
        itemLines:
          existingPurchase.itemLines && existingPurchase.itemLines.length > 0
            ? existingPurchase.itemLines.map((line, idx) => ({
                ...line,
                itemCode: line.itemCode || line.tagNo || `ITM-${idx + 1}`,
                tagNo: line.tagNo || line.itemCode || `TAG-${idx + 1}`,
                uom: line.uom || "GMS",
                rateType: line.rateType,
                tax: line.tax || "3%",
              }))
            : [
                {
                  ...DEFAULT_LINE_ITEM,
                  itemCode: "ITM-001",
                  tagNo: "TAG-001",
                },
              ],
      });
    }
  }, [existingPurchase, isEditing]);

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
    formData.purchaseReturnAmount,
    formData.kasarAmount,
    formData.giftVoucherAmount,
  ]);

  // Keep grand totals in formData in sync
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

  // Handler when daybook changes: generates voucher number
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
          tableName: "purchases",
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
        const prefix = db?.voucherPrefix || "PUR";
        setFormData((prev) => ({
          ...prev,
          voucherNo: `${prefix}-1`,
        }));
      }
    },
    [daybooks],
  );

  // Auto-generate voucher number on initial load for new purchases
  useEffect(() => {
    if (!isEditing && daybooks.length > 0 && !formData.daybookId) {
      const defaultDb = daybooks[0];
      handleSelectDaybook(String(defaultDb.id));
    }
  }, [isEditing, daybooks, formData.daybookId, handleSelectDaybook]);

  // Handlers for Line Items
  const handleLineItemChange = useCallback(
    (index: number, field: keyof PurchaseLineItem, value: any) => {
      setFormData((prev) => {
        const updatedLines = [...(prev.itemLines || [])];
        if (!updatedLines[index]) return prev;
        const current = { ...updatedLines[index], [field]: value };

        if (field === "itemCode") {
          current.tagNo = value;
        } else if (field === "tagNo") {
          current.itemCode = value;
        }

        const updatedLine = calculateLineItemAmount(current, field);
        updatedLines[index] = updatedLine;
        return { ...prev, itemLines: updatedLines };
      });
    },
    [],
  );

  const applyLineItemUpdates = useCallback(
    (index: number, updates: Partial<PurchaseLineItem>) => {
      setFormData((prev) => {
        const updatedLines = [...(prev.itemLines || [])];
        if (!updatedLines[index]) return prev;

        let current = { ...updatedLines[index], ...updates };

        if (updates.itemCode !== undefined) current.tagNo = updates.itemCode;
        if (updates.tagNo !== undefined) current.itemCode = updates.tagNo;

        current = calculateLineItemAmount(current);
        updatedLines[index] = current;
        return { ...prev, itemLines: updatedLines };
      });
    },
    [],
  );

  const handleAddLineItem = useCallback(() => {
    const nextNum = Math.floor(100 + Math.random() * 900);
    const newLine: PurchaseLineItem = {
      ...DEFAULT_LINE_ITEM,
      itemCode: `ITM-${nextNum}`,
      tagNo: `TAG-${nextNum}`,
    };
    setFormData((prev) => ({
      ...prev,
      itemLines: [...(prev.itemLines || []), newLine],
    }));
  }, []);

  const handleDeleteLineItem = useCallback((index: number) => {
    setFormData((prev) => {
      const lines = prev.itemLines || [];
      if (lines.length <= 1) {
        return {
          ...prev,
          itemLines: [
            {
              ...DEFAULT_LINE_ITEM,
              itemCode: "ITM-001",
              tagNo: "TAG-001",
            },
          ],
        };
      }
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

      const field = event.colDef.field as keyof PurchaseLineItem;
      let value = event.newValue;

      if (field === "itemGroupName") {
        const grp = itemGroups.find((g) => g.itemGroupName === value);
        if (grp) {
          const updates = getItemGroupUpdates(grp, rateTypes, "purchase");
          applyLineItemUpdates(rowIndex, updates);
          return;
        }
      }

      if (field === "itemName") {
        const matched = items.find((i) => i.itemName === value);
        if (matched) {
          handleLineItemChange(rowIndex, "itemId", matched.id);
          handleLineItemChange(rowIndex, "itemName", matched.itemName);
          return;
        }
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
    [handleLineItemChange, itemGroups, items],
  );

  const columnDefs = useMemo<ColDef[]>(() => {
    return [
      {
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
        headerName: "Pcs",
        field: "pcs",
        width: 80,
        type: "numericColumn",
        editable: (p) => !p.node?.rowPinned,
        cellEditor: "agNumberCellEditor",
        cellEditorParams: { min: 1, step: 1 },
        valueParser: (params) => {
          if (params.newValue === "" || params.newValue == null) return 1;
          const n = parseInt(params.newValue, 10);
          return isNaN(n) ? 1 : n;
        },
        valueFormatter: (p) =>
          p.value != null && p.value !== "" ? String(p.value) : "",
      },
      {
        headerName: "UOM",
        field: "uom",
        width: 90,
        editable: (p) => !p.node?.rowPinned,
        cellEditor: SelectCellEditor,
        cellEditorParams: {
          options: measureUnits,
          valueKey: "listValue",
          labelKey: "listValue",
        },
      },
      {
        headerName: "Gross Wt.",
        field: "grossWt",
        width: 110,
        type: "numericColumn",
        editable: (p) => !p.node?.rowPinned,
        cellEditor: "agNumberCellEditor",
        cellEditorParams: { min: 0, step: 0.001, precision: 3 },
        valueParser: (params) => {
          if (params.newValue === "" || params.newValue == null) return 0;
          const n = parseFloat(params.newValue);
          return isNaN(n) ? 0 : n;
        },
        valueFormatter: (p) =>
          p.value != null && p.value !== "" && !isNaN(Number(p.value))
            ? Number(p.value).toFixed(3)
            : "",
      },
      {
        headerName: "Net Wt.",
        field: "netWt",
        width: 110,
        type: "numericColumn",
        editable: false,
        valueFormatter: (p) =>
          p.value != null && p.value !== "" && !isNaN(Number(p.value))
            ? Number(p.value).toFixed(3)
            : "",
      },
      {
        headerName: "Rate (₹)",
        field: "rate",
        width: 115,
        type: "numericColumn",
        editable: (p) => !p.node?.rowPinned,
        cellEditor: "agNumberCellEditor",
        cellEditorParams: { min: 0, step: 0.01, precision: 2 },
        valueParser: (params) => {
          if (params.newValue === "" || params.newValue == null) return 0;
          const n = parseFloat(params.newValue);
          return isNaN(n) ? 0 : n;
        },
        valueFormatter: (p) =>
          p.value != null && p.value !== "" && !isNaN(Number(p.value))
            ? Number(p.value).toFixed(2)
            : "",
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
          searchPlaceholder: "Search Rate Type...",
          width: 320,
          height: 220,
        },
      },
      {
        headerName: "Discount (₹)",
        field: "discountAmount",
        width: 115,
        type: "numericColumn",
        editable: (p) => !p.node?.rowPinned,
        cellEditor: "agNumberCellEditor",
        cellEditorParams: { min: 0, step: 0.01, precision: 2 },
        valueParser: (params) => {
          if (params.newValue === "" || params.newValue == null) return 0;
          const n = parseFloat(params.newValue);
          return isNaN(n) ? 0 : n;
        },
        valueFormatter: (p) =>
          p.value != null && p.value !== "" && !isNaN(Number(p.value))
            ? Number(p.value).toFixed(2)
            : "",
      },
      {
        headerName: "Amount (₹)",
        field: "amount",
        width: 135,
        type: "numericColumn",
        editable: false,
        valueFormatter: (p) =>
          p.value != null && p.value !== "" && !isNaN(Number(p.value))
            ? Number(p.value).toFixed(2)
            : "",
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
  }, [handleDeleteLineItem, itemGroups, items]);

  const pinnedBottomRowData = useMemo(() => {
    return [
      {
        itemGroupName: "TOTAL",
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

  // Supplier Selection Handler
  const handleSelectSupplier = (accountOrId: any) => {
    const acc =
      typeof accountOrId === "object"
        ? accountOrId
        : accounts.find((a) => a.id === Number(accountOrId));
    if (acc) {
      setFormData((prev) => ({
        ...prev,
        accountId: acc.id,
        accountName:
          acc.accountName ||
          `${acc.firstName || ""} ${acc.lastName || ""}`.trim(),
      }));
    }
  };

  // Item Group Selection for Grid Line Item
  const handleSelectItemGroupForRow = useCallback(
    (rowIndex: number, grp: any) => {
      if (!grp) return;
      const updates = getItemGroupUpdates(grp, rateTypes, "purchase");
      applyLineItemUpdates(rowIndex, updates);
    },
    [rateTypes, applyLineItemUpdates],
  );

  // Item Selection for Grid Line Item
  const handleSelectItemForRow = useCallback((rowIndex: number, item: any) => {
    setFormData((prev) => {
      const lines = [...(prev.itemLines || [])];
      if (!lines[rowIndex]) return prev;
      const current = { ...lines[rowIndex] };
      current.itemId = item.id;
      current.itemName = item.itemName;
      if (!current.tagNo || current.tagNo.startsWith("TAG-")) {
        current.tagNo = item.shortName || item.itemName;
        current.itemCode = item.shortName || item.itemName;
      }
      lines[rowIndex] = current;
      return { ...prev, itemLines: lines };
    });
  }, []);

  // Save / Update
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = async () => {
    if (!formData.voucherNo?.trim()) {
      alert("Please provide a Voucher / Bill Number.");
      return;
    }

    const payload: Omit<PurchaseData, "id"> = {
      voucherNo: formData.voucherNo || "PUR-001",
      srNo: formData.srNo,
      voucherDate:
        formData.voucherDate || new Date().toISOString().slice(0, 10),
      daybookId: formData.daybookId || 1,
      daybookName: formData.daybookName || "PURCHASE",
      reference: formData.reference || "",
      accountId: formData.accountId,
      remarks: formData.remarks || "",
      purchaserName: formData.purchaserName || "",
      billMode: formData.billMode || "Debit Memo",
      supplierPhone: formData.supplierPhone || "",
      supplierAltPhone: formData.supplierAltPhone || "",
      supplierAddress1: formData.supplierAddress1 || "",
      supplierAddress2: formData.supplierAddress2 || "",
      supplierCity: formData.supplierCity || "",
      supplierPincode: formData.supplierPincode || "",
      supplierState: formData.supplierState || "",
      supplierGstNo: formData.supplierGstNo || "",
      supplierPanNo: formData.supplierPanNo || "",
      supplierAadharNo: formData.supplierAadharNo || "",
      supplierEmail: formData.supplierEmail || "",
      itemLines: (formData.itemLines || []).filter(
        (line) => line.itemId && line.itemId > 0,
      ),
      subtotal: calculatedTotals.subtotal,
      discountRate: formData.discountRate || 0,
      discountAmount: calculatedTotals.totalLineDiscount + couponDiscount,
      taxRate: formData.taxRate || 3,
      taxAmount: calculatedTotals.taxAmount,
      roundOff: calculatedTotals.roundOff,
      grandTotal: calculatedTotals.grandTotal,
      cashAmount: formData.cashAmount || 0,
      bankAmount: formData.bankAmount || 0,
      bankName: formData.bankName || "",
      cardAmount: formData.cardAmount || 0,
      cardCommission: formData.cardCommission || 0,
      advanceAmount: formData.advanceAmount || 0,
      urdAmount: formData.urdAmount || 0,
      purchaseReturnAmount: formData.purchaseReturnAmount || 0,
      schemeAmount: formData.schemeAmount || 0,
      giftVoucherAmount: formData.giftVoucherAmount || 0,
      kasarAmount: formData.kasarAmount || 0,
      tdsAmount: formData.tdsAmount || 0,
      rateFixType: formData.rateFixType || "Fix",
      dueDate: formData.dueDate,
      deliveryPending: formData.deliveryPending || false,
      isActive: formData.isActive ?? true,
    };

    if (payload.itemLines.length === 0) {
      alert("Please add at least one valid item to save the purchase.");
      return;
    }

    if (isEditing) {
      updateMutation.mutate(
        { id: purchaseId, data: payload },
        {
          onSuccess: () => {
            navigate(WEB_ROUTES.TRANSACTION.PURCHASE_LIST);
          },
          onError: (err: any) => {
            alert(err?.message || "Failed to update purchase voucher");
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          navigate(WEB_ROUTES.TRANSACTION.PURCHASE_LIST);
        },
        onError: (err: any) => {
          alert(err?.message || "Failed to create purchase voucher");
        },
      });
    }
  };

  const handleClear = () => {
    const defaultDb = daybooks[0];
    const defaultDbId = defaultDb?.id || 1;
    setFormData({
      voucherNo: "",
      srNo: undefined,
      voucherDate: new Date().toISOString().slice(0, 10),
      daybookId: defaultDbId,
      daybookName: defaultDb?.daybookName || "PURCHASE",
      reference: "",
      remarks: "",
      purchaserName: "",
      billMode: "Debit Memo",
      supplierPhone: "",
      supplierAddress1: "",
      supplierCity: "",
      supplierPincode: "",
      supplierState: "",
      itemLines: [{ ...DEFAULT_LINE_ITEM }],
      taxRate: 3,
      cashAmount: 0,
      bankAmount: 0,
      cardAmount: 0,
      advanceAmount: 0,
      urdAmount: 0,
      isActive: true,
    });
    setCouponDiscount(0);
    handleSelectDaybook(String(defaultDbId));
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    const isConfirmed = await confirmAlert({
      title: "Delete Purchase Voucher",
      description: `Are you sure you want to delete purchase voucher ${formData.voucherNo}? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (isConfirmed) {
      deleteMutation.mutate(purchaseId, {
        onSuccess: () => {
          navigate(WEB_ROUTES.TRANSACTION.PURCHASE_LIST);
        },
      });
    }
  };

  // Record Navigation (Prev / Next record from list)
  const handleNavigateRecord = (direction: "prev" | "next") => {
    if (!allPurchases.length) return;
    const currentIndex = allPurchases.findIndex((p) => p.id === purchaseId);
    let targetIndex = -1;
    if (direction === "prev") {
      targetIndex =
        currentIndex > 0 ? currentIndex - 1 : allPurchases.length - 1;
    } else {
      targetIndex =
        currentIndex >= 0 && currentIndex < allPurchases.length - 1
          ? currentIndex + 1
          : 0;
    }
    const targetPurchase = allPurchases[targetIndex];
    if (targetPurchase) {
      const token = encodeURL({ id: targetPurchase.id });
      navigate(buildRoute(WEB_ROUTES.TRANSACTION.PURCHASE, { token }));
    }
  };

  if (isEditing && isLoadingPurchase) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Loading purchase voucher #{purchaseId}...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-slate-50/60 dark:bg-zinc-950">
      <div className="flex-1 space-y-4 p-5 md:p-6">
        {/* ── SECTION 1: VOUCHER DETAILS & SUPPLIER PROFILE ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* LEFT 4 COLS: Daybook & Voucher Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Voucher Information
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Daybook */}
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Daybook <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={formData.daybookId ? String(formData.daybookId) : ""}
                  onValueChange={handleSelectDaybook}
                >
                  <SelectTrigger className="h-8 text-xs font-medium">
                    <SelectValue placeholder="Select Daybook" />
                  </SelectTrigger>
                  <SelectContent>
                    {daybooks.length > 0 ? (
                      daybooks.map((db) => (
                        <SelectItem key={db.id} value={String(db.id)}>
                          {db.daybookName} ({db.voucherPrefix || "PUR"})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No purchase daybook found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Bill / Voucher No. */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Bill No. <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formData.voucherNo || ""}
                  disabled
                  className="h-8 text-xs font-medium"
                  placeholder="e.g. PUR-215"
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Date
                </Label>
                <DatePicker
                  value={formData.voucherDate}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      voucherDate: val,
                    }))
                  }
                  className="h-8 text-xs"
                />
              </div>

              {/* Purchaser */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-600 dark:text-zinc-400">
                  Purchaser
                </Label>
                <Input
                  value={formData.purchaserName || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      purchaserName: e.target.value,
                    }))
                  }
                  className="h-8 text-xs"
                  placeholder="e.g. Rajesh Kumar"
                />
              </div>

              {/* Reference */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-600 dark:text-zinc-400">
                  Reference / Ref
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
                  placeholder="e.g. PO-9812"
                />
              </div>
            </div>
          </div>

          {/* MIDDLE 5 COLS: Supplier Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-5">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Supplier / Party Details
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <PopupTable
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2.5 text-[11px] border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 gap-1.5 shadow-2xs"
                      title="Search Supplier in Dropdown Table"
                    >
                      <Search className="h-3 w-3 text-slate-500" />
                      Find Supplier
                    </Button>
                  }
                  placement="bottom-end"
                  apiEndpoint={API_ENDPOINTS.ACCOUNTS.BASE}
                  columns={accountDropdownColumns}
                  onSelect={handleSelectSupplier}
                  searchPlaceholder="Search suppliers..."
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Supplier Name & Phone */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-12 sm:col-span-7 space-y-1">
                  <Label className="text-xs text-slate-600 dark:text-zinc-400">
                    Supplier Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={formData.accountName || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        accountName: e.target.value,
                      }))
                    }
                    placeholder="e.g. Mahesh Traders"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-12 sm:col-span-5 space-y-1">
                  <Label className="text-xs text-slate-600 dark:text-zinc-400">
                    Mobile No.
                  </Label>
                  <Input
                    value={formData.supplierPhone || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplierPhone: e.target.value,
                      }))
                    }
                    placeholder="e.g. 9876543210"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Address Line 1 & Line 2 */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-12 sm:col-span-7 space-y-1">
                  <Label className="text-xs text-slate-600 dark:text-zinc-400">
                    Address Line 1
                  </Label>
                  <Input
                    value={formData.supplierAddress1 || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplierAddress1: e.target.value,
                      }))
                    }
                    placeholder="e.g. Shop 12, Silver Market"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-12 sm:col-span-5 space-y-1">
                  <Label className="text-xs text-slate-600 dark:text-zinc-400">
                    Alternate No.
                  </Label>
                  <Input
                    value={formData.supplierAltPhone || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplierAltPhone: e.target.value,
                      }))
                    }
                    placeholder="e.g. 9123456780"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* City, Pincode, State */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600 dark:text-zinc-400">
                    City
                  </Label>
                  <Input
                    value={formData.supplierCity || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplierCity: e.target.value,
                      }))
                    }
                    placeholder="Surat"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600 dark:text-zinc-400">
                    Pincode
                  </Label>
                  <Input
                    value={formData.supplierPincode || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplierPincode: e.target.value,
                      }))
                    }
                    placeholder="395003"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-600 dark:text-zinc-400">
                    State
                  </Label>
                  <Input
                    value={formData.supplierState || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplierState: e.target.value,
                      }))
                    }
                    placeholder="Gujarat"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 3 COLS: Supplier Tabs (General Info / Shipping / KYC Upload) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-3">
            <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-zinc-800">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setSupplierTab("general")}
                  className={`rounded-md px-2 py-1 text-xs transition-all ${
                    supplierTab === "general"
                      ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  General Info
                </button>
                <button
                  type="button"
                  onClick={() => setSupplierTab("shipping")}
                  className={`rounded-md px-2 py-1 text-xs transition-all ${
                    supplierTab === "shipping"
                      ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  Shipping
                </button>
                <button
                  type="button"
                  onClick={() => setSupplierTab("kyc")}
                  className={`rounded-md px-2 py-1 text-xs transition-all ${
                    supplierTab === "kyc"
                      ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  KYC Docs
                </button>
              </div>
            </div>

            {/* General Info Tab */}
            {supplierTab === "general" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-500">
                    GSTIN / Tax No.
                  </Label>
                  <Input
                    value={formData.supplierGstNo || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplierGstNo: e.target.value,
                      }))
                    }
                    placeholder="24AAACH7409R1ZZ"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-500">
                    PAN Card No.
                  </Label>
                  <Input
                    value={formData.supplierPanNo || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplierPanNo: e.target.value,
                      }))
                    }
                    placeholder="ABCDE1234F"
                    className="h-7 text-xs uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-500">
                    Aadhar Card No.
                  </Label>
                  <Input
                    value={formData.supplierAadharNo || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplierAadharNo: e.target.value,
                      }))
                    }
                    placeholder="4532 8901 2341"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Shipping Info Tab */}
            {supplierTab === "shipping" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-500">
                    Supplier Email
                  </Label>
                  <Input
                    type="email"
                    value={formData.supplierEmail || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplierEmail: e.target.value,
                      }))
                    }
                    placeholder="supplier@example.com"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-500">
                    Landmark / Delivery
                  </Label>
                  <Input
                    value={formData.supplierAddress2 || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        supplierAddress2: e.target.value,
                      }))
                    }
                    placeholder="Near Gold Market"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="delivery-pending-box"
                    checked={formData.deliveryPending || false}
                    onCheckedChange={(c) =>
                      setFormData((prev) => ({
                        ...prev,
                        deliveryPending: Boolean(c),
                      }))
                    }
                  />
                  <Label
                    htmlFor="delivery-pending-box"
                    className="text-xs cursor-pointer"
                  >
                    Pending Delivery
                  </Label>
                </div>
              </div>
            )}

            {/* KYC & Media Upload Tab */}
            {supplierTab === "kyc" && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
                <UploadCloud className="h-7 w-7 text-slate-400" />
                <p className="mt-1 text-xs text-slate-700 dark:text-zinc-200">
                  KYC & Document Media
                </p>
                <p className="text-[10px] text-slate-500">
                  Aadhar, PAN, GST Cert (PDF / JPG)
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-6 text-[10px]"
                >
                  Attach File
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 2: TRANSACTION LINE ITEMS GRID ── */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/80">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Purchase Item Line Details
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddLineItem}
                className="h-7 gap-1.5 border-amber-300 bg-amber-50 text-xs text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item Row</span>
              </Button>
            </div>
          </div>

          <div
            className="w-full"
            style={{
              height: `${Math.min(520, Math.max(260, ((formData.itemLines?.length || 1) + 2) * 38 + 48))}px`,
            }}
          >
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
        </div>

        {/* ── SECTION 3: FINANCIAL SUMMARY & MULTI-TENDER SETTLEMENT ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* CARD 1 (3 COLS): SUMMARY & TAXES */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-3">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Tax & Grand Summary
                </h3>
              </div>
              <div className="flex rounded bg-slate-100 p-0.5 text-[10px] font-semibold dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => setTaxMode("GST")}
                  className={`rounded px-1.5 py-0.5 ${taxMode === "GST" ? "bg-white shadow-xs text-slate-900 dark:bg-zinc-700 dark:text-zinc-100" : "text-slate-500"}`}
                >
                  GST
                </button>
                <button
                  type="button"
                  onClick={() => setTaxMode("IGST")}
                  className={`rounded px-1.5 py-0.5 ${taxMode === "IGST" ? "bg-white shadow-xs text-slate-900 dark:bg-zinc-700 dark:text-zinc-100" : "text-slate-500"}`}
                >
                  IGST
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-zinc-800/60">
                <span className="text-slate-600 dark:text-zinc-400">
                  Gross Subtotal:
                </span>
                <span className="text-slate-900 dark:text-zinc-100">
                  ₹
                  {calculatedTotals.subtotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-zinc-800/60">
                <span className="text-slate-600 dark:text-zinc-400">
                  Special Coupon / Disc:
                </span>
                <div className="w-24">
                  <AmountInput
                    value={couponDiscount}
                    onChange={(val) => setCouponDiscount(val)}
                    className="h-6 text-xs text-right"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-zinc-800/60">
                <div className="flex items-center gap-1">
                  <span className="text-slate-600 dark:text-zinc-400">
                    {taxMode === "GST" ? "CGST + SGST" : "IGST"}
                  </span>
                  <span className="rounded bg-slate-100 px-1 text-[10px] text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {formData.taxRate || 3}%
                  </span>
                </div>
                <span className="font-medium text-slate-900 dark:text-zinc-100">
                  ₹
                  {calculatedTotals.taxAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-zinc-800/60">
                <span className="text-slate-600 dark:text-zinc-400">
                  Round Off:
                </span>
                <span className="text-slate-500">
                  {calculatedTotals.roundOff >= 0
                    ? `+₹${calculatedTotals.roundOff}`
                    : `-₹${Math.abs(calculatedTotals.roundOff)}`}
                </span>
              </div>

              {/* Net Grand Total Card */}
              <div className="mt-3 rounded-lg border border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/50 p-3 shadow-xs dark:border-amber-800 dark:from-amber-950/40 dark:to-amber-900/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Net Payable
                  </span>
                  <Badge className="bg-amber-600 text-white hover:bg-amber-600">
                    Dr
                  </Badge>
                </div>
                <div className="mt-1 text-2xl font-black tracking-tight text-amber-900 dark:text-amber-100">
                  ₹
                  {calculatedTotals.grandTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2 (6 COLS): PAYMENT SETTLEMENT MODES */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-6">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-zinc-800">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setSettlementTab("receipt")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    settlementTab === "receipt"
                      ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  Payment / Tender Modes
                </button>
                <button
                  type="button"
                  onClick={() => setSettlementTab("remarks")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    settlementTab === "remarks"
                      ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  Notes & Remarks
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-500">
                  Mode:
                </span>
                <Select
                  value={formData.billMode || "Debit Memo"}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, billMode: val }))
                  }
                >
                  <SelectTrigger className="h-6 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BILL_MODES.map((bm) => (
                      <SelectItem key={bm} value={bm}>
                        {bm}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {settlementTab === "receipt" ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Cash */}
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div className="flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        Cash
                      </span>
                    </div>
                    <div className="w-28">
                      <AmountInput
                        value={formData.cashAmount ?? 0}
                        onChange={(val) =>
                          setFormData((prev) => ({ ...prev, cashAmount: val }))
                        }
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>

                  {/* Bank / UPI */}
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        Bank / UPI
                      </span>
                    </div>
                    <div className="w-28">
                      <AmountInput
                        value={formData.bankAmount ?? 0}
                        onChange={(val) =>
                          setFormData((prev) => ({ ...prev, bankAmount: val }))
                        }
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>

                  {/* Credit / Debit Card */}
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-purple-600" />
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        Card
                      </span>
                    </div>
                    <div className="w-28">
                      <AmountInput
                        value={formData.cardAmount ?? 0}
                        onChange={(val) =>
                          setFormData((prev) => ({ ...prev, cardAmount: val }))
                        }
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>

                  {/* Advance */}
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        Advance
                      </span>
                    </div>
                    <div className="w-28">
                      <AmountInput
                        value={formData.advanceAmount ?? 0}
                        onChange={(val) =>
                          setFormData((prev) => ({
                            ...prev,
                            advanceAmount: val,
                          }))
                        }
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div className="flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        URD
                      </span>
                    </div>
                    <div className="w-28">
                      <AmountInput
                        value={formData.urdAmount ?? 0}
                        onChange={(val) =>
                          setFormData((prev) => ({ ...prev, urdAmount: val }))
                        }
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>

                  {/* Kasar */}
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div className="flex items-center gap-1.5">
                      <Percent className="h-3.5 w-3.5 text-rose-500" />
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        Kasar (Disc.)
                      </span>
                    </div>
                    <div className="w-28">
                      <AmountInput
                        value={formData.kasarAmount ?? 0}
                        onChange={(val) =>
                          setFormData((prev) => ({ ...prev, kasarAmount: val }))
                        }
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/60">
                  <div>
                    <span className="text-[11px] text-slate-500">
                      Total Payment Made:{" "}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                      ₹
                      {calculatedTotals.totalPaid.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">Balance:</span>
                    {calculatedTotals.balanceDue <= 0 ? (
                      <Badge className="bg-emerald-600 text-white">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Fully Settled
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
                      >
                        ₹
                        {calculatedTotals.balanceDue.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        Due
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Purchase Remarks & Notes
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
                  placeholder="Enter purchase notes, terms, delivery instructions, quality requirements..."
                  className="w-full rounded-md border border-slate-200 bg-transparent p-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-zinc-800 dark:text-zinc-100"
                />
              </div>
            )}
          </div>

          {/* CARD 3 (3 COLS): TERMS & OTHER DETAILS */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-3">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Terms & Delivery
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Details</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-slate-500">
                  Rate Fix Type
                </Label>
                <Select
                  value={formData.rateFixType || "Fix"}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, rateFixType: val }))
                  }
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fix">Fixed Rate</SelectItem>
                    <SelectItem value="Floating">
                      Floating / Market Rate
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-slate-500">
                  Payment Due Date
                </Label>
                <DatePicker
                  value={formData.dueDate}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      dueDate: val,
                    }))
                  }
                  className="h-7 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-slate-500">
                  TDS Amount (₹)
                </Label>
                <AmountInput
                  value={formData.tdsAmount ?? 0}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, tdsAmount: val }))
                  }
                  className="h-7 text-xs"
                />
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2 text-[11px] text-slate-500 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex justify-between">
                  <span>Supplier Ledger OS:</span>
                  <span className="font-medium text-slate-900 dark:text-zinc-100">
                    ₹0.00
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span>Bill OS:</span>
                  <span className="font-medium text-amber-600">
                    ₹
                    {calculatedTotals.balanceDue.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FormFooter
        showVoucherNavigation={true}
        onNavigatePrev={() => handleNavigateRecord("prev")}
        onNavigateNext={() => handleNavigateRecord("next")}
        onPrint={() => setIsPrintModalOpen(true)}
        printText="Print Purchase Invoice"
        onDelete={isEditing ? handleDelete : undefined}
        deleteText="Delete"
        onClear={handleClear}
        clearText="Clear"
        onBack={() => navigate(WEB_ROUTES.TRANSACTION.PURCHASE_LIST)}
        backText="Back"
        onSave={handleSave}
        saveText={isEditing ? "Update" : "Save"}
        isSaving={isSaving}
        isSaveDisabled={isSaving}
      />

      {/* ── PRINT PURCHASE INVOICE PREVIEW MODAL ── */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base">
              <span>Purchase Invoice Preview</span>
              <Badge variant="outline" className="text-xs">
                {formData.voucherNo}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div
            id="printable-purchase-invoice"
            className="border border-slate-200 p-6 rounded-lg bg-white text-slate-900 space-y-4"
          >
            {/* Company Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-black tracking-tight text-amber-700">
                  MATRIX JEWELLERS & LUXURY RETAIL
                </h2>
                <p className="text-xs text-slate-600">
                  402, Matrix Heights, CG Road, Navrangpura, Ahmedabad - 380009
                </p>
                <p className="text-xs text-slate-600">
                  GSTIN: 24AAACM4901P1Z8 &bull; Phone: +91 79 2640 9811
                </p>
              </div>
              <div className="text-right">
                <Badge className="bg-amber-600 text-white font-bold">
                  PURCHASE INVOICE
                </Badge>
                <p className="mt-1 text-xs font-bold">
                  Invoice #{formData.voucherNo}
                </p>
                <p className="text-xs text-slate-500">
                  Date: {formData.voucherDate}
                </p>
              </div>
            </div>

            {/* Bill To & Invoice Meta */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="rounded border border-slate-100 p-2.5 bg-slate-50">
                <p className="font-semibold text-slate-800 uppercase tracking-wider text-[10px]">
                  Purchased From:
                </p>
                <p className="font-bold text-sm text-slate-900">
                  {formData.accountName || "Unknown Supplier"}
                </p>
                {formData.supplierPhone && (
                  <p className="text-slate-600">
                    Phone: {formData.supplierPhone}
                  </p>
                )}
                {formData.supplierAddress1 && (
                  <p className="text-slate-600">
                    {formData.supplierAddress1}, {formData.supplierCity}
                  </p>
                )}
                {formData.supplierGstNo && (
                  <p className="text-slate-600">
                    GSTIN: {formData.supplierGstNo}
                  </p>
                )}
                {formData.supplierPanNo && (
                  <p className="text-slate-600">
                    PAN: {formData.supplierPanNo}
                  </p>
                )}
              </div>
              <div className="rounded border border-slate-100 p-2.5 bg-slate-50 text-right">
                <p className="font-semibold text-slate-800 uppercase tracking-wider text-[10px]">
                  Payment & Terms:
                </p>
                <p className="text-slate-700">
                  Mode:{" "}
                  <span className="font-semibold">{formData.billMode}</span>
                </p>
                <p className="text-slate-700">
                  Purchaser:{" "}
                  <span className="font-semibold">
                    {formData.purchaserName || "N/A"}
                  </span>
                </p>
                <p className="text-slate-700">
                  Reference:{" "}
                  <span className="font-semibold">
                    {formData.reference || "N/A"}
                  </span>
                </p>
                <p className="text-slate-700">
                  Rate Type:{" "}
                  <span className="font-semibold">{formData.rateFixType}</span>
                </p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-xs border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px]">
                  <th className="p-1.5 text-center">#</th>
                  <th className="p-1.5 text-left">Item Description</th>
                  <th className="p-1.5 text-left">Purity</th>
                  <th className="p-1.5 text-right">Net Wt</th>
                  <th className="p-1.5 text-right">Rate (₹)</th>
                  <th className="p-1.5 text-right">Labour (₹)</th>
                  <th className="p-1.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(formData.itemLines || []).map((line, i) => (
                  <tr key={i}>
                    <td className="p-1.5 text-center">{i + 1}</td>
                    <td className="p-1.5 font-medium">
                      {line.itemName || "Jewellery Item"}
                      {line.tagNo && (
                        <span className="text-[10px] text-slate-400 block">
                          Tag: {line.tagNo}
                        </span>
                      )}
                    </td>
                    <td className="p-1.5">{line.purity || "22K"}</td>
                    <td className="p-1.5 text-right">
                      {Number(line.netWt || 0).toFixed(3)}g
                    </td>
                    <td className="p-1.5 text-right">
                      ₹{line.rate?.toLocaleString("en-IN")}
                    </td>
                    <td className="p-1.5 text-right">
                      ₹{line.labourAmount?.toLocaleString("en-IN")}
                    </td>
                    <td className="p-1.5 text-right font-semibold">
                      ₹{line.amount?.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Invoice Totals Breakdown */}
            <div className="flex justify-between items-start text-xs pt-2">
              <div className="max-w-xs text-[11px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Remarks / Terms:</p>
                <p>{formData.remarks || "Standard purchase terms apply."}</p>
              </div>
              <div className="w-64 space-y-1.5 text-right">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-medium">
                    ₹
                    {calculatedTotals.subtotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {calculatedTotals.totalLineDiscount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>
                      -₹
                      {calculatedTotals.totalLineDiscount.toLocaleString(
                        "en-IN",
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">GST (3%):</span>
                  <span>
                    ₹
                    {calculatedTotals.taxAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-1 font-bold text-sm text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-amber-800">
                    ₹
                    {calculatedTotals.grandTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPrintModalOpen(false)}
            >
              Close
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              <span>Print Document</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Purchase;
