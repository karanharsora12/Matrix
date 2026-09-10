import { useAccountMasterData, useAccounts } from "@/api/accounts";
import {
  generateVoucherNo,
  useDaybookGroups,
  useDaybooks,
} from "@/api/daybooks";
import { useItemGroups, useItems } from "@/api/inventory";
import {
  useCreateSale,
  useDeleteSale,
  useSale,
  useSales,
  useUpdateSale,
  type Sale,
  type SaleLineItem,
} from "@/api/sales";
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
  ChevronDown,
  Coins,
  CreditCard,
  Download,
  FileText,
  Paperclip,
  Percent,
  Plus,
  Printer,
  Receipt,
  Search,
  Settings2,
  Sparkles,
  Tag,
  UploadCloud,
  User,
  UserPlus,
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

const DEFAULT_LINE_ITEM: SaleLineItem = {
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

export const Sales: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const tokenData = decodeURL<{ id?: number }>(params?.token);
  const saleId = tokenData?.id ? Number(tokenData.id) : 0;
  const isEditing = saleId > 0;
  const gridRef = useRef<AgGridReact>(null);

  // Master Data Queries
  const { data: salesListResp } = useSales();
  const { data: daybooksResp } = useDaybooks();
  const { data: daybookGroupsResp } = useDaybookGroups();
  const { data: accountsResp } = useAccounts();
  const { data: accountMasterResp } = useAccountMasterData();
  const { data: itemsResp } = useItems();
  const { data: itemGroupsResp } = useItemGroups();
  const { data: existingSale, isLoading: isLoadingSale } = useSale(
    isEditing ? saleId : undefined,
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
  const allSales = salesListResp?.data || [];

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
        headerName: "Account Name",
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
        headerName: "GroupName",
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
        valueGetter: (p) => typeMap[p.data?.accountTypeId] || "Customer",
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

  // Item Popup Table Columns
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

  // Filter daybooks for SALES menu only
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

  const [customerTab, setCustomerTab] = useState<
    "general" | "shipping" | "kyc"
  >("general");
  const [settlementTab, setSettlementTab] = useState<"receipt" | "remarks">(
    "receipt",
  );
  const [rightTab, setRightTab] = useState<"additional" | "shipping" | "notes">(
    "additional",
  );
  const [paymentTab, setPaymentTab] = useState<
    "cash" | "bank" | "card" | "upi"
  >("cash");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [quickBarcode, setQuickBarcode] = useState("");
  const [taxMode, setTaxMode] = useState<"GST" | "IGST">("GST");
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [priceList, setPriceList] = useState("Default Price List");
  const [currency, setCurrency] = useState("INR - Indian Rupee (₹)");
  const [salesTypeLocal, setSalesTypeLocal] = useState("Local Sale");
  const [placeOfSupply, setPlaceOfSupply] = useState("Gujarat (24)");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const [formData, setFormData] = useState<Partial<Sale>>({
    voucherNo: "",
    voucherDate: new Date().toISOString().slice(0, 10),
    daybookId: undefined,
    daybookName: "",
    reference: "",
    remarks: "",
    salesmanName: "Amit Verma",
    billMode: "Debit Memo",
    customerPhone: "",
    customerAltPhone: "",
    customerAddress1: "",
    customerAddress2: "",
    customerCity: "Ahmedabad",
    customerPincode: "380009",
    customerState: "Gujarat",
    customerGstNo: "",
    customerPanNo: "",
    customerAadharNo: "",
    customerEmail: "",
    itemLines: [{ ...DEFAULT_LINE_ITEM, id: `line-${Date.now()}` }],
    subtotal: 0,
    discountRate: 0,
    discountAmount: 0,
    taxRate: 3, // Standard jewellery GST is 3%
    taxAmount: 0,
    roundOff: 0,
    grandTotal: 0,
    cashAmount: 0,
    bankAmount: 0,
    bankName: "HDFC Bank",
    cardAmount: 0,
    cardCommission: 0,
    advanceAmount: 0,
    urdAmount: 0,
    salesReturnAmount: 0,
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
    if (existingSale && isEditing) {
      setFormData({
        ...existingSale,
        itemLines:
          existingSale.itemLines && existingSale.itemLines.length > 0
            ? existingSale.itemLines.map((line, idx) => ({
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
  }, [existingSale, isEditing]);

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

  // Handler when daybook changes or is selected: generates voucher number
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

  // Auto-generate voucher number on initial load for new sales
  useEffect(() => {
    if (!isEditing && daybooks.length > 0 && !formData.daybookId) {
      const defaultDb = daybooks[0];
      handleSelectDaybook(String(defaultDb.id));
    }
  }, [isEditing, daybooks, formData.daybookId, handleSelectDaybook]);

  // Handlers for Line Items
  const handleLineItemChange = useCallback(
    (index: number, field: keyof SaleLineItem, value: any) => {
      setFormData((prev) => {
        const updatedLines = [...(prev.itemLines || [])];
        if (!updatedLines[index]) return prev;
        const current = { ...updatedLines[index], [field]: value };

        // Synchronize itemCode and tagNo
        if (field === "itemCode") {
          current.tagNo = value;
        } else if (field === "tagNo") {
          current.itemCode = value;
        }

        // Auto-calculate line amount based on rateType
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
    const newLine: SaleLineItem = {
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

  // Quick Barcode Scan Handler
  const handleQuickBarcodeAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickBarcode.trim()) return;

    // Search if an item matches
    const searchTag = quickBarcode.trim();
    const matchedItem = items.find(
      (item) =>
        item.shortName?.toLowerCase() === searchTag.toLowerCase() ||
        item.itemName?.toLowerCase().includes(searchTag.toLowerCase()),
    );

    const newLine: SaleLineItem = {
      ...DEFAULT_LINE_ITEM,
      itemCode: searchTag.toUpperCase(),
      tagNo: searchTag.toUpperCase(),
      itemId: matchedItem?.id || 0,
      itemName: matchedItem?.itemName || `Item ${searchTag}`,
      itemGroupId: 0,
      itemGroupName: "",
      pcs: 0,
      uom: "",
      grossWt: 0,
      netWt: 0,
      rate: 0,
      rateType: "",
      labourAmount: 0,
      discountAmount: 0,
      tax: "",
      amount: 0,
    };

    setFormData((prev) => ({
      ...prev,
      itemLines: [...(prev.itemLines || []), newLine],
    }));
    setQuickBarcode("");
  };

  const handleCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {
      if (event.node?.rowPinned) return;
      const rowIndex = event.rowIndex;
      if (rowIndex == null || rowIndex < 0) return;

      const field = event.colDef.field as keyof SaleLineItem;
      let value = event.newValue;

      if (field === "itemGroupName") {
        const grp = itemGroups.find((g) => g.itemGroupName === value);
        if (grp) {
          const updates = getItemGroupUpdates(grp, rateTypes, "sales");
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

  // Customer Selection Handler
  const handleSelectCustomer = (accountOrId: any) => {
    const acc =
      typeof accountOrId === "object"
        ? accountOrId
        : accounts.find((a) => a.id === Number(accountOrId));
    if (acc) {
      setFormData((prev) => ({
        ...prev,
        partyId: acc.id,
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
      const updates = getItemGroupUpdates(grp, rateTypes, "sales");
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

    const payload: Omit<Sale, "id"> = {
      voucherNo: formData.voucherNo || "INV-001",
      srNo: formData.srNo,
      voucherDate:
        formData.voucherDate || new Date().toISOString().slice(0, 10),
      daybookId: formData.daybookId || 1,
      daybookName: formData.daybookName || "RETAIL INVOICE",
      reference: formData.reference || "",
      accountId: formData.accountId,
      remarks: formData.remarks || "",
      salesmanName: formData.salesmanName || "Sales Executive",
      billMode: formData.billMode || "Debit Memo",
      customerPhone: formData.customerPhone || "",
      customerAltPhone: formData.customerAltPhone || "",
      customerAddress1: formData.customerAddress1 || "",
      customerAddress2: formData.customerAddress2 || "",
      customerCity: formData.customerCity || "",
      customerPincode: formData.customerPincode || "",
      customerState: formData.customerState || "",
      customerGstNo: formData.customerGstNo || "",
      customerPanNo: formData.customerPanNo || "",
      customerAadharNo: formData.customerAadharNo || "",
      customerEmail: formData.customerEmail || "",
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
      salesReturnAmount: formData.salesReturnAmount || 0,
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
      createMutation.mutate(payload, {
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
    setFormData({
      voucherNo: "",
      srNo: undefined,
      voucherDate: new Date().toISOString().slice(0, 10),
      daybookId: defaultDbId,
      daybookName: defaultDb?.daybookName || "RETAIL INVOICE",
      reference: "",
      remarks: "",
      salesmanName: "Amit Verma",
      billMode: "Debit Memo",
      customerPhone: "",
      customerAddress1: "",
      customerCity: "Ahmedabad",
      customerPincode: "380009",
      customerState: "Gujarat",
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

  // Record Navigation (Prev / Next record from list)
  const handleNavigateRecord = (direction: "prev" | "next") => {
    if (!allSales.length) return;
    const currentIndex = allSales.findIndex((s) => s.id === saleId);
    let targetIndex = -1;
    if (direction === "prev") {
      targetIndex = currentIndex > 0 ? currentIndex - 1 : allSales.length - 1;
    } else {
      targetIndex =
        currentIndex >= 0 && currentIndex < allSales.length - 1
          ? currentIndex + 1
          : 0;
    }
    const targetSale = allSales[targetIndex];
    if (targetSale) {
      const token = encodeURL({ id: targetSale.id });
      navigate(buildRoute(WEB_ROUTES.TRANSACTION.SALES, { token }));
    }
  };

  if (isEditing && isLoadingSale) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Loading sales voucher #{saleId}...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-[#f5f6fa] dark:bg-zinc-950">
      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          PAGE HEADER â€” title, document selector, invoice number, settings
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
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
            {/* Daybook / Invoice type selector */}
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

            {/* Invoice Number display */}
            <div className="flex h-8 min-w-[130px] items-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {formData.voucherNo || "INV-2025-0001"}
            </div>

            {/* Settings icon */}
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
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            ROW 1: Customer Details | Invoice Details | Additional Info Tabs
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* â”€â”€ CARD: Customer Details (4 cols) â”€â”€ */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 px-4 py-2.5">
              <User className="h-4 w-4 text-primary-action" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Customer Details
              </h2>
            </div>

            <div className="p-4 space-y-3">
              {/* Customer search field */}
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                  Customer <span className="text-rose-500">*</span>
                </Label>
                <div className="flex gap-1.5">
                  <PopupTable
                    trigger={
                      <button
                        type="button"
                        className="flex flex-1 h-8 items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">
                            {formData.accountName || "Walk-in Customer"}
                          </span>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                      </button>
                    }
                    placement="bottom-start"
                    apiEndpoint={API_ENDPOINTS.ACCOUNTS.BASE}
                    columns={accountDropdownColumns}
                    onSelect={handleSelectCustomer}
                    searchPlaceholder="Search customer..."
                  />
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-primary-action/10 hover:text-primary-action hover:border-primary-action/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 shrink-0"
                    title="Add new customer"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Customer info card */}
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-850">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-100 truncate">
                      {formData.accountName || "Walk-in Customer"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {formData.customerCity || "Ahmedabad"},{" "}
                      {formData.customerState || "Gujarat"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      GST:{" "}
                      {formData.customerGstNo
                        ? formData.customerGstNo
                        : "Unregistered"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setCustomerTab("general")}
                      className="text-[11px] font-medium text-primary-action hover:underline mt-0.5"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* â”€â”€ CARD: Invoice Details (5 cols) â”€â”€ */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 px-4 py-2.5">
              <FileText className="h-4 w-4 text-primary-action" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Invoice Details
              </h2>
            </div>

            <div className="p-4 space-y-3">
              {/* Row 1: Invoice Date, Due Date, Invoice No */}
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

              {/* Row 2: Reference No, Sales Person */}
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

          {/* â”€â”€ CARD: Additional Info / Shipping / Notes Tabs (4 cols) â”€â”€ */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4 overflow-hidden">
            {/* Tab Header */}
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
              {/* Additional Info tab */}
              {rightTab === "additional" && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                      Price List
                    </Label>
                    <Select value={priceList} onValueChange={setPriceList}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Default Price List">
                          Default Price List
                        </SelectItem>
                        <SelectItem value="Wholesale">Wholesale</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                      Currency
                    </Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR - Indian Rupee (₹)">
                          INR - Indian Rupee (₹)
                        </SelectItem>
                        <SelectItem value="USD ($)">USD ($)</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                      Sales Type
                    </Label>
                    <Select
                      value={salesTypeLocal}
                      onValueChange={setSalesTypeLocal}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Local Sale">Local Sale</SelectItem>
                        <SelectItem value="Interstate">
                          Interstate Sale
                        </SelectItem>
                        <SelectItem value="Export">Export</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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

              {/* Shipping tab */}
              {rightTab === "shipping" && (
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-slate-500">
                      Recipient Email
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

              {/* Notes tab */}
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

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            ROW 2: Item Details â€” Toolbar + AG Grid + Add Row
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
          {/* Item Details Header + Toolbar */}
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

          {/* AG Grid */}
          <div
            style={{
              height: `${Math.min(520, Math.max(240, ((formData.itemLines?.length || 1) + 2) * 38 + 48))}px`,
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

          {/* Add New Row button */}
          <div className="border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2">
            <button
              type="button"
              onClick={handleAddLineItem}
              className="flex items-center gap-1.5 text-xs font-medium text-primary-action hover:text-primary-action/80"
            >
              <Plus className="h-3.5 w-3.5" />
              Add New Row
            </button>
          </div>
        </div>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            ROW 3: Terms & Conditions | Summary | Payment Details + Attachments
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* â”€â”€ CARD: Terms & Conditions (4 cols) â”€â”€ */}
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

          <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-4 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 px-4 py-2.5">
              <Receipt className="h-4 w-4 text-primary-action" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Summary
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-0">
                {/* Total Items */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">
                    Total Items
                  </span>
                  <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                    {formData.itemLines?.length || 0}
                  </span>
                </div>
                {/* Total Quantity */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">
                    Total Quantity
                  </span>
                  <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                    {calculatedTotals.pcs}
                  </span>
                </div>
                {/* Total Amount */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">
                    Total Amount
                  </span>
                  <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                    ₹
                    {(
                      calculatedTotals.subtotal +
                      calculatedTotals.totalLineDiscount
                    ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {/* Total Discount */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">
                    Total Discount
                  </span>
                  <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                    ₹
                    {calculatedTotals.totalLineDiscount.toLocaleString(
                      "en-IN",
                      { minimumFractionDigits: 2 },
                    )}
                  </span>
                </div>
                {/* Taxable Amount */}
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">
                    Taxable Amount
                  </span>
                  <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                    ₹
                    {calculatedTotals.subtotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {/* Tax Rows: CGST + SGST or IGST */}
                {taxMode === "GST" ? (
                  <>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50">
                      <span className="text-xs text-slate-600 dark:text-zinc-400">
                        CGST ({((formData.taxRate || 3) / 2).toFixed(1)}%)
                      </span>
                      <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                        ₹
                        {(calculatedTotals.taxAmount / 2).toLocaleString(
                          "en-IN",
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50">
                      <span className="text-xs text-slate-600 dark:text-zinc-400">
                        SGST ({((formData.taxRate || 3) / 2).toFixed(1)}%)
                      </span>
                      <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                        ₹
                        {(calculatedTotals.taxAmount / 2).toLocaleString(
                          "en-IN",
                          { minimumFractionDigits: 2 },
                        )}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-zinc-800/50">
                    <span className="text-xs text-slate-600 dark:text-zinc-400">
                      IGST ({formData.taxRate || 3}%)
                    </span>
                    <span className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                      ₹
                      {calculatedTotals.taxAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
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
                  ₹
                  {calculatedTotals.grandTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* â”€â”€ CARD: Payment Details + Attachments (4 cols) â”€â”€ */}
          <div className="lg:col-span-4 space-y-3">
            {/* Payment Details */}
            <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 px-4 py-2.5">
                <CreditCard className="h-4 w-4 text-primary-action" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Payment Details
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {/* Payment Type Pills */}
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

                {/* Received Amount + Balance */}
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
                        ₹{" "}
                        {calculatedTotals.balanceDue.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
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
        onNavigatePrev={() => handleNavigateRecord("prev")}
        onNavigateNext={() => handleNavigateRecord("next")}
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

      {/* â”€â”€ PRINT TAX INVOICE PREVIEW MODAL â”€â”€ */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base">
              <span>Tax Invoice Preview</span>
              <Badge variant="outline" className="text-xs">
                {formData.voucherNo}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {/* Printable Invoice Container */}
          <div
            id="printable-tax-invoice"
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
                  RETAIL TAX INVOICE
                </Badge>
                <p className="mt-1 text-xs  font-bold">
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
                  Billed To:
                </p>
                <p className="font-bold text-sm text-slate-900">
                  {formData.accountName || "Walk-in Customer"}
                </p>
                {formData.customerPhone && (
                  <p className="text-slate-600">
                    Phone: {formData.customerPhone}
                  </p>
                )}
                {formData.customerAddress1 && (
                  <p className="text-slate-600">
                    {formData.customerAddress1}, {formData.customerCity}
                  </p>
                )}
                {formData.customerGstNo && (
                  <p className="text-slate-600 ">
                    GSTIN: {formData.customerGstNo}
                  </p>
                )}
                {formData.customerPanNo && (
                  <p className="text-slate-600 ">
                    PAN: {formData.customerPanNo}
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
                  Salesman:{" "}
                  <span className="font-semibold">{formData.salesmanName}</span>
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
                    <td className="p-1.5 text-center ">{i + 1}</td>
                    <td className="p-1.5 font-medium">
                      {line.itemName || "Jewellery Item"}
                      {line.tagNo && (
                        <span className="text-[10px] text-slate-400 block">
                          Tag: {line.tagNo}
                        </span>
                      )}
                    </td>
                    <td className="p-1.5">{line.purity || "22K"}</td>
                    <td className="p-1.5 text-right ">
                      {Number(line.netWt || 0).toFixed(3)}g
                    </td>
                    <td className="p-1.5 text-right ">
                      ₹{line.rate?.toLocaleString("en-IN")}
                    </td>
                    <td className="p-1.5 text-right ">
                      ₹{line.labourAmount?.toLocaleString("en-IN")}
                    </td>
                    <td className="p-1.5 text-right  font-semibold">
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
                <p>
                  {formData.remarks ||
                    "All jewellery items are BIS Hallmarked. 100% Certified."}
                </p>
              </div>
              <div className="w-64 space-y-1.5 text-right">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className=" font-medium">
                    ₹
                    {calculatedTotals.subtotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {calculatedTotals.totalLineDiscount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span className="">
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
                  <span className="">
                    ₹
                    {calculatedTotals.taxAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-1 font-bold text-sm text-slate-900">
                  <span>Grand Total:</span>
                  <span className=" text-emerald-800">
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

      {/* â”€â”€ TAG PRINT PREVIEW MODAL â”€â”€ */}
      <Dialog open={isTagModalOpen} onOpenChange={setIsTagModalOpen}>
        <DialogContent className="max-w-md p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-amber-600" />
              <span>Print Jewellery Tags</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Printable jewelry barcode tags for line items:
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(formData.itemLines || []).map((line, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs dark:border-amber-900/40 dark:bg-amber-950/20"
                >
                  <div className="flex justify-between font-bold text-slate-900 dark:text-zinc-100">
                    <span>{line.tagNo || `TAG-${i + 1}`}</span>
                    <span>{line.purity || "22K"}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-zinc-300 mt-1">
                    {line.itemName || "Item"}
                  </div>
                  <div className="mt-1 flex justify-between  text-[11px] text-slate-700 dark:text-zinc-300">
                    <span>GW: {Number(line.grossWt || 0).toFixed(3)}</span>
                    <span>NW: {Number(line.netWt || 0).toFixed(3)}</span>
                    <span className="font-semibold text-amber-800 dark:text-amber-300">
                      ₹{line.amount?.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTagModalOpen(false)}
            >
              Close
            </Button>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              <span>Print Tags</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
