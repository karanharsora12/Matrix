import type { ICellEditorParams } from "ag-grid-community";
import { forwardRef, useImperativeHandle, useState, useMemo } from "react";
import { PopupTable } from "./PopupTable";

export interface PopupCellEditorParams extends ICellEditorParams {
  tableData?: any[];
  apiEndpoint?: string;
  apiPayload?: Record<string, any>;
  columns?: any[];
  columnDefs?: any[];
  onItemSelect?: (item: any, rowIndex: number) => void;
  searchPlaceholder?: string;
  width?: number;
  height?: number;
  displayKey?: string;
  valueKey?: string;
}

export const PopupCellEditor = forwardRef<any, PopupCellEditorParams>(
  (props, ref) => {
    const [open, setOpen] = useState(true);

    useImperativeHandle(ref, () => ({
      getValue() {
        return props.value;
      },
      isCancelAfterEnd() {
        return false;
      },
    }));

    const selectedValue = useMemo(() => {
      if (
        props.value !== undefined &&
        props.value !== null &&
        props.value !== ""
      ) {
        return typeof props.value === "string"
          ? props.value
          : String(props.value);
      }
      const field = props.colDef?.field;
      if (
        field &&
        props.data?.[field] !== undefined &&
        props.data?.[field] !== null
      ) {
        return String(props.data[field]);
      }
      if (
        props.displayKey &&
        props.data?.[props.displayKey] !== undefined &&
        props.data?.[props.displayKey] !== null
      ) {
        return String(props.data[props.displayKey]);
      }
      return "";
    }, [props.value, props.data, props.colDef, props.displayKey]);

    const formattedDisplay = useMemo(() => {
      if (
        props.colDef?.valueFormatter &&
        typeof props.colDef.valueFormatter === "function"
      ) {
        try {
          const res = (props.colDef.valueFormatter as any)({
            ...props,
            value: selectedValue,
          });
          if (res !== undefined && res !== null) return String(res);
        } catch {}
      }
      return selectedValue;
    }, [props, selectedValue]);

    const handleSelect = (item: any) => {
      if (props.onItemSelect) {
        props.onItemSelect(item, props.rowIndex);
      }
      setOpen(false);
      props.stopEditing();
    };

    const handleOpenChange = (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) {
        props.stopEditing();
      }
    };

    return (
      <PopupTable
        open={open}
        onOpenChange={handleOpenChange}
        tableData={props.tableData}
        apiEndpoint={props.apiEndpoint}
        columns={props.columns || props.columnDefs}
        onSelect={handleSelect}
        searchPlaceholder={props.searchPlaceholder}
        width={props.width}
        height={props.height}
        value={selectedValue}
        displayValue={formattedDisplay}
        apiPayload={props.apiPayload}
      />
    );
  },
);

PopupCellEditor.displayName = "PopupCellEditor";
