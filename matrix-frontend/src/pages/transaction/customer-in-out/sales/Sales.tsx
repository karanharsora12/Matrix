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
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { WEB_ROUTES } from "@/config/webRoutes";
import { TransactionMenu, getDaybooksByMenu } from "@/constants/enums";
import { buildRoute, decodeURL, encodeURL } from "@/lib/utils";
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
import { AmountInput, WeightInput } from "@/components/ui/numeric-input";
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
  Barcode,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  FileText,
  Percent,
  Plus,
  Printer,
  Receipt,
  Search,
  Sparkles,
  Tag,
  UploadCloud,
  User,
  Wallet,
} from "lucide-react";
import type { RootState } from "@/store";
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
  quantity: 1,
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
  const { rateTypes } = useSelector((state: RootState) => state.inventory);

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
        cellClass: "font-semibold text-slate-900 dark:text-zinc-100",
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
        cellClass: "font-mono text-center",
      },
      {
        headerName: "Short Name",
        field: "userName",
        width: 100,
        cellClass: "font-mono text-xs",
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
        flex: 1,
        cellClass: "font-semibold text-slate-900 dark:text-zinc-100",
      },
      {
        headerName: "Short Name",
        field: "shortName",
        width: 100,
        cellClass: "font-mono text-xs text-slate-700 dark:text-zinc-300",
        valueGetter: (p) => p.data?.shortName || "-",
      },
      {
        headerName: "Touch %",
        field: "salesRate",
        width: 105,
        type: "numericColumn",
        cellClass: "font-mono font-medium text-slate-800 dark:text-zinc-200",
        valueFormatter: (p) =>
          p.value != null ? `${Number(p.value).toFixed(2)} %` : "-",
      },
      {
        headerName: "ID",
        field: "id",
        width: 60,
        type: "numericColumn",
        cellClass: "font-mono text-center text-slate-700 dark:text-zinc-300",
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
        flex: 1,
        cellClass: "font-semibold text-slate-900 dark:text-zinc-100",
      },
      {
        headerName: "Short Name",
        field: "shortName",
        width: 120,
        cellClass: "font-mono text-xs text-slate-700 dark:text-zinc-300",
        valueGetter: (p) => p.data?.shortName || "-",
      },
      {
        headerName: "ID",
        field: "id",
        width: 65,
        type: "numericColumn",
        cellClass: "font-mono text-center text-slate-700 dark:text-zinc-300",
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
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [quickBarcode, setQuickBarcode] = useState("");
  const [taxMode, setTaxMode] = useState<"GST" | "IGST">("GST");
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  const [formData, setFormData] = useState<Partial<Sale>>({
    voucherNo: "",
    voucherDate: new Date().toISOString().slice(0, 10),
    daybookId: undefined,
    daybookName: "",
    partyId: undefined,
    partyName: "",
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
    status: "Draft",
  });

  useEffect(() => {
    if (existingSale && isEditing) {
      setFormData({
        ...existingSale,
        itemLines:
          existingSale.itemLines && existingSale.itemLines.length > 0
            ? existingSale.itemLines.map((line, idx) => ({
                ...line,
                id: line.id || `line-${idx}-${Date.now()}`,
                itemCode: line.itemCode || line.tagNo || `ITM-${idx + 1}`,
                tagNo: line.tagNo || line.itemCode || `TAG-${idx + 1}`,
                uom: line.uom || "GMS",
                rateType: line.rateType || "Per Gram",
                tax: line.tax || "3%",
              }))
            : [
                {
                  ...DEFAULT_LINE_ITEM,
                  id: `line-${Date.now()}`,
                  itemCode: "ITM-001",
                  tagNo: "TAG-001",
                },
              ],
      });
    }
  }, [existingSale, isEditing]);

  // Calculations
  const calculatedTotals = useMemo(() => {
    const lines = formData.itemLines || [];
    let pcs = 0;
    let grossWt = 0;
    let netWt = 0;
    let fineWt = 0;
    let totalLabour = 0;
    let totalLineDiscount = 0;
    let subtotal = 0;

    lines.forEach((line) => {
      pcs += Number(line.quantity || 0);
      grossWt += Number(line.grossWt || 0);
      netWt += Number(line.netWt || 0);
      fineWt += Number(line.fineWt || 0);
      totalLabour += Number(line.labourAmount || 0);
      totalLineDiscount += Number(line.discountAmount || 0);
      subtotal += Number(line.amount || 0);
    });

    const taxRate = Number(formData.taxRate || 3);
    const taxableAmount = Math.max(0, subtotal - couponDiscount);
    const taxAmount = (taxableAmount * taxRate) / 100;
    const rawTotal = taxableAmount + taxAmount;
    const roundedTotal = Math.round(rawTotal);
    const roundOff = Number((roundedTotal - rawTotal).toFixed(2));
    const grandTotal = roundedTotal;

    // Payments
    const cash = Number(formData.cashAmount || 0);
    const bank = Number(formData.bankAmount || 0);
    const card = Number(formData.cardAmount || 0);
    const advance = Number(formData.advanceAmount || 0);
    const urd = Number(formData.urdAmount || 0);
    const returns = Number(formData.salesReturnAmount || 0);
    const kasar = Number(formData.kasarAmount || 0);
    const gift = Number(formData.giftVoucherAmount || 0);
    const totalPaid =
      cash + bank + card + advance + urd + returns + kasar + gift;
    const balanceDue = grandTotal - totalPaid;

    return {
      pcs,
      grossWt: Number(grossWt.toFixed(3)),
      netWt: Number(netWt.toFixed(3)),
      fineWt: Number(fineWt.toFixed(3)),
      totalLabour: Number(totalLabour.toFixed(2)),
      totalLineDiscount: Number(totalLineDiscount.toFixed(2)),
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      roundOff,
      grandTotal,
      totalPaid,
      balanceDue,
    };
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
        const resp = await generateVoucherNo(dbId);
        if (resp.success && resp.data?.voucherNo) {
          setFormData((prev) => ({
            ...prev,
            voucherNo: resp.data.voucherNo,
          }));
        }
      } catch (err) {
        console.error("Failed to generate voucher number from endpoint:", err);
        const prefix = db?.voucherPrefix || "INV";
        setFormData((prev) => ({
          ...prev,
          voucherNo: `${prefix}-${Math.floor(100 + Math.random() * 900)}`,
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
        const rate = Number(current.rate || 0);
        const labour = Number(current.labourAmount || 0);
        const other = Number(current.otherAmount || 0);
        const discount = Number(current.discountAmount || 0);

        let baseAmount = 0;
        if (current.rateType === "Per Piece") {
          baseAmount = (current.quantity || 1) * rate;
        } else if (current.rateType === "Flat / Fixed") {
          baseAmount = rate;
        } else {
          // Default: "Per Gram"
          const wt = Number(current.netWt || 0);
          baseAmount = (wt > 0 ? wt : current.quantity || 1) * rate;
        }

        current.amount = Math.max(
          0,
          Math.round(baseAmount + labour + other - discount),
        );

        // Auto calculate fine weight if purity is known and netWt exists
        if (field === "purity" || field === "netWt") {
          const net = Number(current.netWt || 0);
          if (current.purity?.includes("91.6")) {
            current.fineWt = Number((net * 0.916).toFixed(3));
          } else if (current.purity?.includes("75.0")) {
            current.fineWt = Number((net * 0.75).toFixed(3));
          } else if (current.purity?.includes("99.9")) {
            current.fineWt = Number((net * 0.999).toFixed(3));
          } else if (current.purity?.includes("92.5")) {
            current.fineWt = Number((net * 0.925).toFixed(3));
          }
        }

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
      id: `line-${Date.now()}`,
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
              id: `line-${Date.now()}`,
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

  const handleDuplicateLineItem = useCallback((index: number) => {
    setFormData((prev) => {
      const lines = prev.itemLines || [];
      const source = lines[index];
      if (!source) return prev;
      const duplicated: SaleLineItem = {
        ...source,
        id: `line-${Date.now()}`,
        itemCode: `${source.itemCode || source.tagNo || "ITM"}-COPY`,
        tagNo: `${source.tagNo || source.itemCode || "TAG"}-COPY`,
      };
      return {
        ...prev,
        itemLines: [
          ...lines.slice(0, index + 1),
          duplicated,
          ...lines.slice(index + 1),
        ],
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
      id: `line-${Date.now()}`,
      itemCode: searchTag.toUpperCase(),
      tagNo: searchTag.toUpperCase(),
      itemId: matchedItem?.id || 1,
      itemName: matchedItem?.itemName || `Item ${searchTag}`,
      itemGroupId: 1,
      itemGroupName: "Gold Jewellery",
      quantity: 1,
      uom: "GMS",
      grossWt: 10.5,
      netWt: 10.2,
      fineWt: 9.34,
      purity: "91.6 (22K)",
      rate: 7250,
      rateType: "Per Gram",
      labourAmount: 3500,
      discountAmount: 0,
      tax: "3%",
      amount: 77450,
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
          handleLineItemChange(rowIndex, "itemGroupId", grp.id);
          handleLineItemChange(rowIndex, "itemGroupName", grp.itemGroupName);
          if (grp.salesRate) {
            handleLineItemChange(rowIndex, "rate", grp.salesRate);
          }
          if (grp.measureUnitCode) {
            handleLineItemChange(rowIndex, "uom", grp.measureUnitCode);
          }
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
          "quantity",
          "grossWt",
          "netWt",
          "fineWt",
          "rate",
          "labourAmount",
          "otherAmount",
          "discountAmount",
        ].includes(field as string)
      ) {
        value = Number(value || 0);
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
        cellClass: "text-center font-mono text-slate-400 font-medium",
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
        cellClass: (p) =>
          p.node?.rowPinned
            ? "font-bold text-slate-900 dark:text-zinc-100"
            : "font-medium",
        valueGetter: (p) =>
          p.node?.rowPinned ? "TOTAL" : p.data?.itemGroupName || "",
        cellRenderer: (p: ICellRendererParams) => {
          if (p.node?.rowPinned) {
            return (
              <span className="font-bold text-slate-900 dark:text-zinc-100">
                {p.value || "TOTAL"}
              </span>
            );
          }
          return (
            <span className="truncate font-medium text-slate-900 dark:text-zinc-100">
              {p.value || ""}
            </span>
          );
        },
      },
      {
        headerName: "Items",
        field: "itemName",
        minWidth: 180,
        flex: 1,
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
        cellClass: (p) => (p.node?.rowPinned ? "" : "font-medium"),
        valueGetter: (p) => (p.node?.rowPinned ? "" : p.data?.itemName || ""),
        cellRenderer: (p: ICellRendererParams) => {
          if (p.node?.rowPinned) return null;
          return (
            <span className="truncate font-medium text-slate-900 dark:text-zinc-100">
              {p.value || ""}
            </span>
          );
        },
      },
      {
        headerName: "Qty",
        field: "quantity",
        width: 80,
        type: "numericColumn",
        editable: (p) => !p.node?.rowPinned,
        cellEditor: "agNumberCellEditor",
        cellEditorParams: { min: 1, step: 1 },
        valueFormatter: (p) =>
          p.value != null && p.value !== "" ? String(p.value) : "",
      },
      {
        headerName: "UOM",
        field: "uom",
        width: 90,
        editable: (p) => !p.node?.rowPinned,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: {
          values: ["GMS", "PCS", "KGS", "MTR", "SET", "PAIR", "BOX"],
        },
        cellClass:
          "text-center font-medium uppercase text-slate-600 dark:text-zinc-400",
        valueGetter: (p) => (p.node?.rowPinned ? "" : p.data?.uom || "GMS"),
      },
      {
        headerName: "Gross Wt.",
        field: "grossWt",
        width: 110,
        type: "numericColumn",
        editable: (p) => !p.node?.rowPinned,
        cellEditor: WeightInput,
        cellEditorParams: { min: 0, step: 0.001 },
      },
      {
        headerName: "Net Wt.",
        field: "netWt",
        width: 110,
        type: "numericColumn",
        editable: (p) => !p.node?.rowPinned,
        cellEditor: WeightInput,
        cellEditorParams: { min: 0, step: 0.001 },
      },
      {
        headerName: "Rate (₹)",
        field: "rate",
        width: 115,
        type: "numericColumn",
        editable: (p) => !p.node?.rowPinned,
        cellEditor: AmountInput,
      },
      {
        headerName: "Rate Type",
        field: "rateType",
        width: 140,
        editable: (p) => !p.node?.rowPinned,
        cellEditor: PopupCellEditor,
        cellEditorParams: {
          data: rateTypes,
          columns: [
            {
              headerName: "Rate Type",
              field: "name",
              flex: 1,
              cellClass: "font-semibold text-slate-900 dark:text-zinc-100",
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
        cellEditor: AmountInput,
      },
      {
        headerName: "Amount (₹)",
        field: "amount",
        width: 135,
        type: "numericColumn",
        editable: false,
      },
      {
        headerName: "",
        width: 85,
        pinned: "right",
        sortable: false,
        filter: false,
        resizable: false,
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
  }, [handleDuplicateLineItem, handleDeleteLineItem, itemGroups, items]);

  const pinnedBottomRowData = useMemo(() => {
    return [
      {
        itemGroupName: "TOTAL",
        itemName: "",
        quantity: calculatedTotals.pcs,
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
        partyName:
          acc.accountName ||
          `${acc.firstName || ""} ${acc.lastName || ""}`.trim(),
        customerEmail: acc.email || prev.customerEmail,
      }));
    }
  };

  // Item Group Selection for Grid Line Item
  const handleSelectItemGroupForRow = useCallback(
    (rowIndex: number, grp: any) => {
      setFormData((prev) => {
        const lines = [...(prev.itemLines || [])];
        if (!lines[rowIndex]) return prev;
        const current = { ...lines[rowIndex] };
        current.itemGroupId = grp.id;
        current.itemGroupName = grp.itemGroupName;
        if (grp.salesRate) {
          current.rate = Number(grp.salesRate);
        }
        if (grp.measureUnitCode) {
          current.uom = grp.measureUnitCode;
        }

        const rate = Number(current.rate || 0);
        const labour = Number(current.labourAmount || 0);
        const other = Number(current.otherAmount || 0);
        const discount = Number(current.discountAmount || 0);

        let baseAmount = 0;
        if (current.rateType === "Per Piece") {
          baseAmount = (current.quantity || 1) * rate;
        } else if (current.rateType === "Flat / Fixed") {
          baseAmount = rate;
        } else {
          const wt = Number(current.netWt || 0);
          baseAmount = (wt > 0 ? wt : current.quantity || 1) * rate;
        }

        current.amount = Math.max(
          0,
          Math.round(baseAmount + labour + other - discount),
        );

        lines[rowIndex] = current;
        return { ...prev, itemLines: lines };
      });
    },
    [],
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
    if (!formData.partyName?.trim() && !formData.partyId) {
      alert("Please specify or select a Customer / Party Name.");
      return;
    }

    const payload: Omit<Sale, "id"> = {
      voucherNo: formData.voucherNo || "INV-001",
      voucherDate:
        formData.voucherDate || new Date().toISOString().slice(0, 10),
      daybookId: formData.daybookId || 1,
      daybookName: formData.daybookName || "RETAIL INVOICE",
      partyId: formData.partyId,
      partyName: formData.partyName || "Walk-in Customer",
      reference: formData.reference || "",
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
      itemLines: formData.itemLines || [],
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
      status: (formData.status as any) || "Posted",
    };

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
    setFormData({
      voucherNo: `HRIA-${Math.floor(200 + Math.random() * 800)}`,
      voucherDate: new Date().toISOString().slice(0, 10),
      daybookId: 1,
      daybookName: "RETAIL INVOICE",
      partyId: undefined,
      partyName: "",
      reference: "",
      remarks: "",
      salesmanName: "Amit Verma",
      billMode: "Debit Memo",
      customerPhone: "",
      customerAddress1: "",
      customerCity: "Ahmedabad",
      customerPincode: "380009",
      customerState: "Gujarat",
      itemLines: [{ ...DEFAULT_LINE_ITEM, id: `line-${Date.now()}` }],
      taxRate: 3,
      cashAmount: 0,
      bankAmount: 0,
      cardAmount: 0,
      advanceAmount: 0,
      urdAmount: 0,
      isActive: true,
      status: "Draft",
    });
    setCouponDiscount(0);
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
    <div className="min-h-full flex flex-col bg-slate-50/60 dark:bg-zinc-950">
      <div className="flex-1 space-y-4 p-5 md:p-6">
        {/* ── SECTION 1: VOUCHER DETAILS & CUSTOMER PROFILE ── */}
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
                          {db.daybookName} ({db.voucherPrefix || "INV"})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No sales daybook found
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
                  className="h-8 text-xs font-mono font-medium"
                  placeholder="e.g. HRIA-215"
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

              {/* Salesman */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Salesman
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
                  placeholder="e.g. Amit Verma"
                />
              </div>

              {/* Reference / Inquiry Info */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Inquiry / Ref
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
                  placeholder="e.g. INQ-9812"
                />
              </div>

              {/* Quick Barcode Scanner Input */}
              <div className="col-span-2 mt-1 rounded-lg border border-amber-200 bg-amber-50/50 p-2 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                    <Barcode className="h-3.5 w-3.5" />
                    <span>Barcode / Tag Scanner</span>
                  </div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">
                    Press Enter
                  </span>
                </div>
                <form onSubmit={handleQuickBarcodeAdd} className="flex gap-1.5">
                  <Input
                    value={quickBarcode}
                    onChange={(e) => setQuickBarcode(e.target.value)}
                    placeholder="Scan or type Tag # (e.g. TAG-GLD-101)"
                    className="h-7 bg-white text-xs dark:bg-zinc-900"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 bg-amber-600 px-2.5 text-xs text-white hover:bg-amber-700 dark:bg-amber-600"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* MIDDLE 5 COLS: Customer Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-5">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Customer / Party Details
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <PopupTable
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2.5 text-[11px] font-medium border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 gap-1.5 shadow-2xs"
                      title="Search Party in Dropdown Table"
                    >
                      <Search className="h-3 w-3 text-slate-500" />
                      Find Party
                    </Button>
                  }
                  placement="bottom-end"
                  apiEndpoint={API_ENDPOINTS.ACCOUNTS.BASE}
                  columnDefs={accountDropdownColumns}
                  onSelect={handleSelectCustomer}
                  searchPlaceholder="Search accounts..."
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Customer Name & Phone */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-12 sm:col-span-7 space-y-1">
                  <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                    Customer Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={formData.partyName || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        partyName: e.target.value,
                      }))
                    }
                    placeholder="e.g. Rahul Sharma"
                    className="h-8 text-xs font-medium"
                  />
                </div>
                <div className="col-span-12 sm:col-span-5 space-y-1">
                  <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                    Mobile No.
                  </Label>
                  <Input
                    value={formData.customerPhone || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerPhone: e.target.value,
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
                  <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                    Address Line 1
                  </Label>
                  <Input
                    value={formData.customerAddress1 || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerAddress1: e.target.value,
                      }))
                    }
                    placeholder="e.g. B-402, Shivalik Heights"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-12 sm:col-span-5 space-y-1">
                  <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                    Alternate No.
                  </Label>
                  <Input
                    value={formData.customerAltPhone || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerAltPhone: e.target.value,
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
                  <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
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
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                    Pincode
                  </Label>
                  <Input
                    value={formData.customerPincode || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerPincode: e.target.value,
                      }))
                    }
                    placeholder="380009"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                    State
                  </Label>
                  <Input
                    value={formData.customerState || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerState: e.target.value,
                      }))
                    }
                    placeholder="Gujarat"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 3 COLS: Customer Tabs (General Info / Tax / KYC Upload) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-3">
            <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-zinc-800">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCustomerTab("general")}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
                    customerTab === "general"
                      ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  General Info
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerTab("shipping")}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
                    customerTab === "shipping"
                      ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  Shipping
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerTab("kyc")}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
                    customerTab === "kyc"
                      ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  KYC Docs
                </button>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="h-3 w-3" />
                <span>GST: 3%</span>
              </div>
            </div>

            {/* General Info Tab */}
            {customerTab === "general" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-500">
                    GSTIN / Tax No.
                  </Label>
                  <Input
                    value={formData.customerGstNo || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerGstNo: e.target.value,
                      }))
                    }
                    placeholder="24AAACH7409R1ZZ"
                    className="h-7 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-500">
                    PAN Card No.
                  </Label>
                  <Input
                    value={formData.customerPanNo || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerPanNo: e.target.value,
                      }))
                    }
                    placeholder="ABCDE1234F"
                    className="h-7 text-xs font-mono uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-500">
                    Aadhar Card No.
                  </Label>
                  <Input
                    value={formData.customerAadharNo || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customerAadharNo: e.target.value,
                      }))
                    }
                    placeholder="4532 8901 2341"
                    className="h-7 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* Shipping Info Tab */}
            {customerTab === "shipping" && (
              <div className="space-y-2">
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
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-slate-500">
                    Landmark / Delivery
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
                    Pending Store Delivery
                  </Label>
                </div>
              </div>
            )}

            {/* KYC & Media Upload Tab */}
            {customerTab === "kyc" && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
                <UploadCloud className="h-7 w-7 text-slate-400" />
                <p className="mt-1 text-xs font-medium text-slate-700 dark:text-zinc-200">
                  KYC & Document Media
                </p>
                <p className="text-[10px] text-slate-500">
                  Aadhar, PAN, or Photo (PDF / JPG)
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
              <Coins className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Item Line Details
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddLineItem}
                className="h-7 gap-1.5 border-amber-300 bg-amber-50 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300"
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
                rowHeight: 38,
                headerHeight: 38,
                onCellValueChanged: handleCellValueChanged,
                getRowId: (params) => params.data.id,
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
                <span className="font-mono font-medium text-slate-900 dark:text-zinc-100">
                  ₹
                  {calculatedTotals.subtotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Coupon / Bill Discount */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-zinc-800/60">
                <span className="text-slate-600 dark:text-zinc-400">
                  Special Coupon / Disc:
                </span>
                <div className="w-24">
                  <AmountInput
                    value={couponDiscount}
                    onChange={(val) => setCouponDiscount(val)}
                    className="h-6 text-xs text-right font-mono"
                  />
                </div>
              </div>

              {/* Tax Rate & Amount */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-zinc-800/60">
                <div className="flex items-center gap-1">
                  <span className="text-slate-600 dark:text-zinc-400">
                    {taxMode === "GST" ? "CGST + SGST" : "IGST"}
                  </span>
                  <span className="rounded bg-slate-100 px-1 text-[10px] text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {formData.taxRate || 3}%
                  </span>
                </div>
                <span className="font-mono font-medium text-slate-900 dark:text-zinc-100">
                  ₹
                  {calculatedTotals.taxAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Round Off */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-zinc-800/60">
                <span className="text-slate-600 dark:text-zinc-400">
                  Round Off:
                </span>
                <span className="font-mono text-slate-500">
                  {calculatedTotals.roundOff >= 0
                    ? `+₹${calculatedTotals.roundOff}`
                    : `-₹${Math.abs(calculatedTotals.roundOff)}`}
                </span>
              </div>

              {/* Net Grand Total Card */}
              <div className="mt-3 rounded-lg border border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 shadow-xs dark:border-emerald-800 dark:from-emerald-950/40 dark:to-emerald-900/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Net Payable
                  </span>
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                    Dr
                  </Badge>
                </div>
                <div className="mt-1 text-2xl font-black tracking-tight text-emerald-900 dark:text-emerald-100 font-mono">
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
                  Receipt / Tender Modes
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

              {/* Bill Mode Selector */}
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
                  {/* Cash (F7) */}
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div className="flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        Cash{" "}
                      </span>
                    </div>
                    <div className="w-28">
                      <AmountInput
                        value={formData.cashAmount ?? 0}
                        onChange={(val) =>
                          setFormData((prev) => ({ ...prev, cashAmount: val }))
                        }
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Bank / UPI (F8) */}
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        Bank / UPI{" "}
                      </span>
                    </div>
                    <div className="w-28">
                      <AmountInput
                        value={formData.bankAmount ?? 0}
                        onChange={(val) =>
                          setFormData((prev) => ({ ...prev, bankAmount: val }))
                        }
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Credit / Debit Card (F5) */}
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-purple-600" />
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        Card{" "}
                      </span>
                    </div>
                    <div className="w-28">
                      <AmountInput
                        value={formData.cardAmount ?? 0}
                        onChange={(val) =>
                          setFormData((prev) => ({ ...prev, cardAmount: val }))
                        }
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Advance Adjusted (F4) */}
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        Advance{" "}
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
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* URD / Old Gold Purchase Exchange (F3) */}
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div className="flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        URD / Old Gold{" "}
                      </span>
                    </div>
                    <div className="w-28">
                      <AmountInput
                        value={formData.urdAmount ?? 0}
                        onChange={(val) =>
                          setFormData((prev) => ({ ...prev, urdAmount: val }))
                        }
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Kasar / Roundoff Discount */}
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
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Settlement Balance Status Bar */}
                <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/60">
                  <div>
                    <span className="text-[11px] text-slate-500">
                      Total Tender Received:{" "}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-900 dark:text-zinc-100">
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
                        className="border-amber-300 bg-amber-50 font-mono text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300"
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
                  Invoice Remarks & Customer Notes
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
                  placeholder="Enter any voucher remarks, terms & conditions, hallmarking certificate details, warranty notes..."
                  className="w-full rounded-md border border-slate-200 bg-transparent p-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-zinc-800 dark:text-zinc-100"
                />
              </div>
            )}
          </div>

          {/* CARD 3 (3 COLS): OTHER SUMMARY & DUE DETAILS */}
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
                  className="h-7 text-xs font-mono"
                />
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2 text-[11px] text-slate-500 dark:border-zinc-800 dark:bg-zinc-800/40">
                <div className="flex justify-between">
                  <span>Customer Ledger OS:</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-zinc-100">
                    ₹0.00
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span>Bill OS:</span>
                  <span className="font-mono font-medium text-amber-600">
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
        onTagPrint={() => setIsTagModalOpen(true)}
        tagPrintText="Tag Print"
        onPrint={() => setIsPrintModalOpen(true)}
        printText="Print Invoice"
        onDelete={isEditing ? handleDelete : undefined}
        deleteText="Delete"
        onClear={handleClear}
        clearText="Clear"
        onBack={() => navigate(WEB_ROUTES.TRANSACTION.SALES_LIST)}
        backText="Back"
        onSave={handleSave}
        saveText={isEditing ? "Update" : "Save"}
        isSaving={isSaving}
        isSaveDisabled={isSaving}
      />

      {/* ── PRINT TAX INVOICE PREVIEW MODAL ── */}
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
                <p className="mt-1 text-xs font-mono font-bold">
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
                  {formData.partyName || "Walk-in Customer"}
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
                  <p className="text-slate-600 font-mono">
                    GSTIN: {formData.customerGstNo}
                  </p>
                )}
                {formData.customerPanNo && (
                  <p className="text-slate-600 font-mono">
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
                    <td className="p-1.5 text-center font-mono">{i + 1}</td>
                    <td className="p-1.5 font-medium">
                      {line.itemName || "Jewellery Item"}
                      {line.tagNo && (
                        <span className="text-[10px] text-slate-400 block">
                          Tag: {line.tagNo}
                        </span>
                      )}
                    </td>
                    <td className="p-1.5">{line.purity || "22K"}</td>
                    <td className="p-1.5 text-right font-mono">
                      {line.netWt?.toFixed(3)}g
                    </td>
                    <td className="p-1.5 text-right font-mono">
                      ₹{line.rate?.toLocaleString("en-IN")}
                    </td>
                    <td className="p-1.5 text-right font-mono">
                      ₹{line.labourAmount?.toLocaleString("en-IN")}
                    </td>
                    <td className="p-1.5 text-right font-mono font-semibold">
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
                  <span className="font-mono font-medium">
                    ₹
                    {calculatedTotals.subtotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {calculatedTotals.totalLineDiscount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span className="font-mono">
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
                  <span className="font-mono">
                    ₹
                    {calculatedTotals.taxAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-1 font-bold text-sm text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono text-emerald-800">
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

      {/* ── TAG PRINT PREVIEW MODAL ── */}
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
                  <div className="mt-1 flex justify-between font-mono text-[11px] text-slate-700 dark:text-zinc-300">
                    <span>GW: {line.grossWt?.toFixed(3)}</span>
                    <span>NW: {line.netWt?.toFixed(3)}</span>
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
