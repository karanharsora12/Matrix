import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { PopupCellEditor } from "@/components/common/PopupCellEditor";
import {
  NumericalCellEditor,
  formatNumericalValue,
  parseNumericalValue,
} from "@/components/common/NumericalCell";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/hooks/useRedux";
import { formatDate } from "@/utils/date";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Trash2 } from "lucide-react";
import { useMemo } from "react";
import type { RepairLine } from "./types";

interface UseRepairingReceiptColumnsProps {
  readOnly: boolean;
  onDeleteLine: (rowIndex: number | undefined) => void;
  onUpdateLine: (rowIndex: number, patch: Partial<RepairLine>) => void;
}

export const useRepairingReceiptColumns = ({
  readOnly,
  onDeleteLine,
  onUpdateLine,
}: UseRepairingReceiptColumnsProps) => {
  const rateTypes = useAppSelector((state) => state.inventory.rateTypes);

  return useMemo<ColDef<RepairLine>[]>(() => {
    return [
      {
        field: "itemGroupName",
        headerName: "Item Group",
        width: 170,
        editable: (p) => !readOnly && !p.node?.rowPinned,
        cellEditor: PopupCellEditor,
        cellEditorParams: (params: any) => ({
          apiEndpoint: API_ENDPOINTS.INVENTORY.ITEM_GROUPS,
          columns: [
            { field: "itemGroupName", headerName: "Item Group", width: 180 },
            { field: "shortName", headerName: "Short Name", width: 100 },
          ],
          displayKey: "itemGroupName",
          valueKey: "itemGroupName",
          searchPlaceholder: "Search Item Group...",
          onItemSelect: (item: any, rowIndex: number) => {
            const newGroupId = item?.id ? Number(item.id) : null;
            const currentGroupId = params.data?.itemGroupId;
            const isGroupChanged = newGroupId !== currentGroupId;
            const rateType = rateTypes.find(
              (rt) => rt.id === Number(item?.salesRateTypeId),
            );
            onUpdateLine(rowIndex, {
              itemGroupId: newGroupId,
              itemGroupName: item?.itemGroupName || "",
              ...(rateType
                ? { rateTypeId: rateType.id, rateType: rateType.name }
                : {}),
              ...(isGroupChanged
                ? {
                    itemId: null,
                    itemName: "",
                    tagNo: "",
                  }
                : {}),
            });
          },
        }),
        valueFormatter: (params) =>
          params.node?.rowPinned
            ? (params.value ?? "TOTAL")
            : params.value || "",
        sortable: false,
        filter: false,
      },
      {
        field: "itemName",
        headerName: "Item",
        width: 180,
        editable: (p) => !readOnly && !p.node?.rowPinned,
        cellEditor: PopupCellEditor,
        cellEditorParams: (params: any) => ({
          apiEndpoint: API_ENDPOINTS.INVENTORY.ITEMS,
          apiPayload: params.data?.itemGroupId
            ? { itemGroupId: params.data.itemGroupId }
            : undefined,
          columns: [
            { field: "itemName", headerName: "Item Name", width: 200 },
            { field: "shortName", headerName: "Code", width: 100 },
            { field: "itemGroupName", headerName: "Item Group", width: 140 },
          ],
          displayKey: "itemName",
          valueKey: "itemName",
          searchPlaceholder: "Search Item...",
          onItemSelect: (item: any, rowIndex: number) => {
            const newItemId = Number(item?.id || 0);
            const currentItemId = params.data?.itemId;
            const isItemChanged = newItemId !== currentItemId;

            onUpdateLine(rowIndex, {
              itemId: newItemId,
              itemName: item?.itemName || "",
              ...(item?.itemGroupId
                ? {
                    itemGroupId: Number(item.itemGroupId),
                    itemGroupName: item?.itemGroupName || "",
                  }
                : {}),
              ...(item?.shortName ? { tagNo: item.shortName } : {}),
              ...(isItemChanged && !item?.shortName ? { tagNo: "" } : {}),
            });
          },
        }),
        sortable: false,
        filter: false,
      },
      {
        field: "tagNo",
        headerName: "Item Code",
        width: 140,
        editable: (p) => !readOnly && !p.node?.rowPinned,
        cellEditor: PopupCellEditor,
        cellEditorParams: (params: any) => ({
          apiEndpoint: API_ENDPOINTS.INVENTORY.ITEM_CODES,
          apiPayload: params.data?.itemId
            ? { itemId: params.data.itemId }
            : params.data?.itemGroupId
              ? { itemGroupId: params.data.itemGroupId }
              : undefined,
          columns: [
            { field: "itemCodeName", headerName: "Item Code", width: 160 },
            { field: "itemName", headerName: "Item Name", width: 180 },
            { field: "itemGroupName", headerName: "Item Group", width: 140 },
          ],
          displayKey: "itemCodeName",
          valueKey: "itemCodeName",
          searchPlaceholder: "Search Item Code...",
          onItemSelect: (codeItem: any, rowIndex: number) => {
            onUpdateLine(rowIndex, {
              tagNo: codeItem?.itemCodeName || "",
              ...(codeItem?.itemId
                ? {
                    itemId: Number(codeItem.itemId),
                    itemName: codeItem?.itemName || "",
                  }
                : {}),
              ...(codeItem?.itemGroupId
                ? {
                    itemGroupId: Number(codeItem.itemGroupId),
                    itemGroupName: codeItem?.itemGroupName || "",
                  }
                : {}),
            });
          },
        }),
        sortable: false,
        filter: false,
      },
      {
        field: "itemDescription",
        headerName: "Item Description & Issues",
        width: 230,
        editable: (p) => !readOnly && !p.node?.rowPinned,
        sortable: false,
        filter: false,
      },
      {
        field: "pcs",
        headerName: "PCS",
        width: 80,
        type: "numericColumn",
        editable: (p) => !readOnly && !p.node?.rowPinned,
        cellEditor: NumericalCellEditor,
        cellEditorParams: { type: "integer", decimals: 0, min: 1 },
        valueParser: (p) =>
          parseNumericalValue(p.newValue, { type: "integer", decimals: 0 }),
        valueFormatter: (p) =>
          formatNumericalValue(
            p.value,
            { type: "integer", decimals: 0 },
            Boolean(p.node?.rowPinned),
          ),
        sortable: false,
        filter: false,
      },
      {
        field: "grossWt",
        headerName: "Gross Wt (g)",
        width: 110,
        type: "numericColumn",
        editable: (p) => !readOnly && !p.node?.rowPinned,
        cellEditor: NumericalCellEditor,
        cellEditorParams: { type: "weight", decimals: 3, min: 0 },
        valueParser: (p) =>
          parseNumericalValue(p.newValue, { type: "weight", decimals: 3 }),
        valueFormatter: (p) =>
          formatNumericalValue(
            p.value,
            { type: "weight", decimals: 3 },
            Boolean(p.node?.rowPinned),
          ),
        sortable: false,
        filter: false,
      },
      {
        field: "netWt",
        headerName: "Net Wt (g)",
        width: 110,
        type: "numericColumn",
        editable: (p) => !readOnly && !p.node?.rowPinned,
        cellEditor: NumericalCellEditor,
        cellEditorParams: { type: "weight", decimals: 3, min: 0 },
        valueParser: (p) =>
          parseNumericalValue(p.newValue, { type: "weight", decimals: 3 }),
        valueFormatter: (p) =>
          formatNumericalValue(
            p.value,
            { type: "weight", decimals: 3 },
            Boolean(p.node?.rowPinned),
          ),
        sortable: false,
        filter: false,
      },
      {
        field: "amount",
        headerName: "Taxable Amt",
        width: 130,
        type: "numericColumn",
        editable: (p) => !readOnly && !p.node?.rowPinned,
        cellEditor: NumericalCellEditor,
        cellEditorParams: { type: "amount", decimals: 2, min: 0 },
        valueParser: (p) =>
          parseNumericalValue(p.newValue, { type: "amount", decimals: 2 }),
        valueFormatter: (p) =>
          formatNumericalValue(
            p.value,
            { type: "amount", decimals: 2 },
            Boolean(p.node?.rowPinned),
          ),
        sortable: false,
        filter: false,
      },
      {
        field: "deliveryDate",
        headerName: "Delivery Date",
        width: 125,
        editable: (p) => !readOnly && !p.node?.rowPinned,
        valueFormatter: (p) => (p.value ? formatDate(p.value) : ""),
        sortable: false,
        filter: false,
      },
      {
        field: "rateType",
        headerName: "Labour Rate Type",
        width: 170,
        editable: (p) => !readOnly && !p.node?.rowPinned,
        cellEditor: PopupCellEditor,
        cellEditorParams: {
          tableData: rateTypes,
          columns: [{ field: "name", headerName: "Rate Type", width: 220 }],
          displayKey: "rateType",
          valueKey: "name",
          searchPlaceholder: "Search Labour Rate Type...",
          width: 360,
          height: 280,
          onItemSelect: (item: any, rowIndex: number) => {
            onUpdateLine(rowIndex, {
              rateTypeId: item?.id ? Number(item.id) : null,
              rateType: item?.name || "",
            });
          },
        },
        sortable: false,
        filter: false,
      },
      {
        field: "labourRate",
        headerName: "Labour Rate",
        width: 110,
        type: "numericColumn",
        editable: (p) => !readOnly && !p.node?.rowPinned,
        cellEditor: NumericalCellEditor,
        cellEditorParams: { type: "amount", decimals: 2, min: 0 },
        valueParser: (p) =>
          parseNumericalValue(p.newValue, { type: "amount", decimals: 2 }),
        valueFormatter: (p) =>
          formatNumericalValue(
            p.value,
            { type: "amount", decimals: 2 },
            Boolean(p.node?.rowPinned),
          ),
        sortable: false,
        filter: false,
      },
      {
        field: "labourAmount",
        headerName: "Labour Amt",
        width: 125,
        type: "numericColumn",
        editable: false,
        valueFormatter: (p) =>
          formatNumericalValue(
            p.value,
            { type: "amount", decimals: 2 },
            Boolean(p.node?.rowPinned),
          ),
        sortable: false,
        filter: false,
      },
      {
        field: "itemRemarks",
        headerName: "Item Remarks",
        width: 200,
        editable: (p) => !readOnly && !p.node?.rowPinned,
        sortable: false,
        filter: false,
      },
      {
        colId: "actions",
        headerName: "",
        width: 52,
        pinned: "right",
        cellRenderer: (params: ICellRendererParams<RepairLine>) => {
          if (params.node.rowPinned || readOnly || !params.data) return null;
          return (
            <div className="flex h-full items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                title="Remove item"
                onClick={() => onDeleteLine(params.node?.rowIndex ?? undefined)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
        sortable: false,
        filter: false,
        resizable: false,
      },
    ];
  }, [onDeleteLine, onUpdateLine, rateTypes, readOnly]);
};
