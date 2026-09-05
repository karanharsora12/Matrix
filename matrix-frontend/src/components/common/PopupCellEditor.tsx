import type { ICellEditorParams } from "ag-grid-community";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { PopupTable } from "./PopupTable";

export interface PopupCellEditorParams extends ICellEditorParams {
  tableData?: any[];
  apiEndpoint?: string;
  columns?: any[];
  columnDefs?: any[];
  onItemSelect?: (item: any, rowIndex: number) => void;
  searchPlaceholder?: string;
  width?: number;
  height?: number;
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
      />
    );
  },
);

PopupCellEditor.displayName = "PopupCellEditor";
