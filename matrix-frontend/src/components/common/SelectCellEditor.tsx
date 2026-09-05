import type { ICellEditorParams } from "ag-grid-community";
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const EMPTY_VALUE_TOKEN = "__EMPTY_VALUE__";

export interface SelectCellEditorParams extends ICellEditorParams {
  options?: any[];
  valueKey?: string;
  labelKey?: string;
  placeholder?: string;
  onSelect?: (item: any, rowIndex: number) => void;
  className?: string;
  contentClassName?: string;
}

const serializeVal = (raw: any): string => {
  if (raw === undefined || raw === null || raw === "") {
    return EMPTY_VALUE_TOKEN;
  }
  return String(raw);
};

export const SelectCellEditor = forwardRef<any, SelectCellEditorParams>(
  (props, ref) => {
    const options = useMemo<any[]>(() => {
      const colParams =
        typeof props.colDef?.cellEditorParams === "function"
          ? props.colDef.cellEditorParams(props)
          : props.colDef?.cellEditorParams;

      if (Array.isArray(colParams?.options)) return colParams.options;
      if (Array.isArray(props.options)) return props.options;

      return [];
    }, [props]);

    // 2. Resolve keys
    const colParams =
      typeof props.colDef?.cellEditorParams === "function"
        ? props.colDef.cellEditorParams(props)
        : props.colDef?.cellEditorParams;

    const valueKey = props.valueKey || colParams?.valueKey;
    const labelKey = props.labelKey || colParams?.labelKey;
    const placeholder =
      props.placeholder || colParams?.placeholder || "Select...";

    // Helper functions to get value and label from an option item
    const getItemValue = (item: any) => {
      if (item == null) return "";
      if (typeof item === "object") {
        if (valueKey && item[valueKey] !== undefined) return item[valueKey];
        if (item.value !== undefined) return item.value;
        if (item.id !== undefined) return item.id;
        if (item.code !== undefined) return item.code;
        if (item.listValue !== undefined) return item.listValue;
        if (item.name !== undefined) return item.name;
      }
      return item;
    };

    const getItemLabel = (item: any) => {
      if (item == null) return "";
      if (typeof item === "object") {
        if (labelKey && item[labelKey] !== undefined) return item[labelKey];
        if (item.label !== undefined) return item.label;
        if (item.name !== undefined) return item.name;
        if (item.listValue !== undefined) return item.listValue;
        if (item.title !== undefined) return item.title;
        if (valueKey && item[valueKey] !== undefined) return item[valueKey];
      }
      return String(item);
    };

    // Find initial matched item and value
    const matchedInitial = useMemo(() => {
      if (props.value === undefined || props.value === null) return undefined;
      return options.find(
        (opt) => String(getItemValue(opt)) === String(props.value),
      );
    }, [options, props.value]);

    const initialRawValue =
      matchedInitial !== undefined ? getItemValue(matchedInitial) : props.value;

    const [selectedValue, setSelectedValue] = useState<string>(() =>
      serializeVal(initialRawValue),
    );
    const selectedValueRef = useRef<any>(initialRawValue);
    const [open, setOpen] = useState(true);

    // AG Grid interface
    useImperativeHandle(ref, () => ({
      getValue() {
        return selectedValueRef.current;
      },
      isCancelBeforeStart() {
        return false;
      },
      isCancelAfterEnd() {
        return false;
      },
    }));

    const handleValueChange = (newValStr: string) => {
      const matched = options.find(
        (opt) => serializeVal(getItemValue(opt)) === newValStr,
      );

      const resolvedRawValue =
        newValStr === EMPTY_VALUE_TOKEN
          ? ""
          : matched !== undefined
            ? getItemValue(matched)
            : newValStr;

      selectedValueRef.current = resolvedRawValue;
      setSelectedValue(newValStr);

      if (props.onSelect) {
        props.onSelect(matched ?? resolvedRawValue, props.rowIndex);
      } else if (colParams?.onSelect) {
        colParams.onSelect(matched ?? resolvedRawValue, props.rowIndex);
      }

      setOpen(false);
      props.stopEditing();
    };

    const handleOpenChange = (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        props.stopEditing();
      }
    };

    // Current display label for trigger
    const currentItem = options.find(
      (opt) => serializeVal(getItemValue(opt)) === selectedValue,
    );
    const displayLabel = currentItem
      ? getItemLabel(currentItem)
      : selectedValue !== EMPTY_VALUE_TOKEN && selectedValue !== ""
        ? selectedValue
        : "";

    return (
      <div className="flex h-full w-full items-center">
        <Select
          open={open}
          onOpenChange={handleOpenChange}
          value={selectedValue}
          onValueChange={handleValueChange}
        >
          <SelectTrigger
            className={cn(
              "h-full min-h-0 w-full rounded-none border-0 !border-none bg-transparent px-2 py-0 text-xs sm:text-sm font-normal text-slate-900 dark:text-zinc-100 !shadow-none !outline-none !ring-0 !ring-offset-0 focus:border-none focus:outline-none focus:ring-0 focus-visible:border-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 justify-between",
              props.className,
            )}
          >
            <SelectValue placeholder={placeholder}>
              {displayLabel || undefined}
            </SelectValue>
          </SelectTrigger>

          <SelectContent
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              "z-[9999] min-w-[8rem] max-h-60 overflow-y-auto bg-popover text-popover-foreground shadow-lg border border-border",
              props.contentClassName || colParams?.contentClassName,
            )}
          >
            {options.length === 0 ? (
              <SelectItem
                value="__no_options__"
                disabled
                className="text-xs text-muted-foreground"
              >
                No options available
              </SelectItem>
            ) : (
              options.map((item, idx) => {
                const itemRawVal = getItemValue(item);
                const itemSerializedVal = serializeVal(itemRawVal);
                const itemLabel = getItemLabel(item);

                return (
                  <SelectItem
                    key={`${itemSerializedVal}-${idx}`}
                    value={itemSerializedVal}
                    className="cursor-pointer text-xs sm:text-sm"
                  >
                    {itemLabel}
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>
      </div>
    );
  },
);

SelectCellEditor.displayName = "SelectCellEditor";
