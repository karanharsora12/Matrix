import { NumericInput } from "@/components/ui/numeric-input";
import { cn } from "@/lib/utils";
import type { ICellEditorParams } from "ag-grid-community";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

export type NumericalType = "amount" | "weight" | "integer" | "number";

export interface NumericalCellOptions {
  type?: NumericalType;
  decimals?: number;
  min?: number;
  max?: number;
  step?: number;
  align?: "left" | "right";
  useGrouping?: boolean;
  locale?: string;
  allowNegative?: boolean;
  nullable?: boolean;
  zeroAsBlank?: boolean;
  onValueChange?: (value: number, rowIndex: number) => void;
  className?: string;
}

export interface NumericalCellEditorParams
  extends ICellEditorParams, NumericalCellOptions {}

export const formatNumericalValue = (
  value: any,
  options?: NumericalCellOptions,
  isRowPinned = false,
): string => {
  if (value == null || value === "") return "";

  const clean = typeof value === "string" ? value.replace(/,/g, "") : value;
  const n = typeof clean === "number" ? clean : parseFloat(clean);

  if (isNaN(n)) return "";

  const type = options?.type ?? "amount";
  const decimals =
    options?.decimals ??
    (type === "amount"
      ? 2
      : type === "weight"
        ? 3
        : type === "integer"
          ? 0
          : 2);
  const useGrouping =
    options?.useGrouping ?? (type === "amount" ? true : false);
  const locale = options?.locale ?? "en-IN";
  const zeroAsBlank = options?.zeroAsBlank ?? true;

  if (!isRowPinned && zeroAsBlank && n === 0) {
    return "";
  }

  if (useGrouping) {
    return n.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  return n.toFixed(decimals);
};

export const parseNumericalValue = (
  newValue: any,
  options?: NumericalCellOptions,
): number => {
  if (newValue == null || newValue === "") {
    return options?.nullable ? (null as any) : 0;
  }

  const clean =
    typeof newValue === "string" ? newValue.replace(/,/g, "") : newValue;
  const n = typeof clean === "number" ? clean : parseFloat(clean);

  if (isNaN(n)) {
    return options?.nullable ? (null as any) : 0;
  }

  const type = options?.type ?? "amount";
  const decimals =
    options?.decimals ??
    (type === "amount"
      ? 2
      : type === "weight"
        ? 3
        : type === "integer"
          ? 0
          : 2);

  let finalVal = Number(n.toFixed(decimals));

  if (!options?.allowNegative && finalVal < 0) {
    finalVal = 0;
  }
  if (options?.min != null && finalVal < options.min) {
    finalVal = options.min;
  }
  if (options?.max != null && finalVal > options.max) {
    finalVal = options.max;
  }

  return finalVal;
};

export const NumericalCellEditor = forwardRef<any, NumericalCellEditorParams>(
  (props, ref) => {
    const colParams = useMemo(() => {
      const p =
        typeof props.colDef?.cellEditorParams === "function"
          ? props.colDef.cellEditorParams(props)
          : props.colDef?.cellEditorParams;
      return (p || {}) as NumericalCellOptions;
    }, [props]);

    const type = props.type || colParams.type || "amount";
    const decimals =
      props.decimals ??
      colParams.decimals ??
      (type === "amount"
        ? 2
        : type === "weight"
          ? 3
          : type === "integer"
            ? 0
            : 2);
    const align = props.align || colParams.align || "right";
    const useGrouping =
      props.useGrouping ?? colParams.useGrouping ?? type === "amount";
    const locale = props.locale || colParams.locale || "en-IN";
    const min = props.min ?? colParams.min ?? (type === "integer" ? 1 : 0);
    const max = props.max ?? colParams.max;
    const allowNegative =
      props.allowNegative ?? colParams.allowNegative ?? false;
    const nullable = props.nullable ?? colParams.nullable ?? false;

    // Determine initial text based on how cell editing was triggered
    const initialText = useMemo(() => {
      if (props.eventKey === "Backspace" || props.eventKey === "Delete") {
        return "";
      }
      if (
        props.eventKey &&
        props.eventKey.length === 1 &&
        /[\d.-]/.test(props.eventKey)
      ) {
        return props.eventKey;
      }
      if (props.value != null && props.value !== "") {
        const clean =
          typeof props.value === "string"
            ? props.value.replace(/,/g, "")
            : props.value;
        const n = parseFloat(clean);
        return isNaN(n) ? "" : n.toFixed(decimals);
      }
      return "";
    }, [props.eventKey, props.value, decimals]);

    const [currentVal, setCurrentVal] = useState<number | string>(initialText);
    const valueRef = useRef<number | string>(initialText);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const isCharKey = useRef(
      Boolean(
        props.eventKey &&
        props.eventKey.length === 1 &&
        /[\d.-]/.test(props.eventKey),
      ),
    );

    const commitAndStop = useCallback(
      (cancel = false) => {
        props.stopEditing(cancel);
      },
      [props],
    );

    useImperativeHandle(ref, () => ({
      getValue() {
        const val = valueRef.current;
        if (val === "" || val == null) {
          return nullable ? null : 0;
        }
        const clean = typeof val === "string" ? val.replace(/,/g, "") : val;
        const n = parseFloat(clean as string);
        if (isNaN(n)) return nullable ? null : 0;

        let finalVal = Number(n.toFixed(decimals));
        if (!allowNegative && finalVal < 0) finalVal = 0;
        if (min != null && finalVal < min) finalVal = min;
        if (max != null && finalVal > max) finalVal = max;
        return finalVal;
      },
      isCancelBeforeStart() {
        return false;
      },
      isCancelAfterEnd() {
        return false;
      },
      afterGuiAttached() {
        if (!inputRef.current) return;
        inputRef.current.focus();
        if (isCharKey.current) {
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        } else {
          inputRef.current.select();
        }
      },
    }));

    useEffect(() => {
      if (!inputRef.current) return;
      inputRef.current.focus();
      if (isCharKey.current) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      } else {
        inputRef.current.select();
      }
    }, []);

    const handleChange = (val: number) => {
      valueRef.current = val;
      setCurrentVal(val);

      if (props.onValueChange) {
        props.onValueChange(val, props.rowIndex);
      } else if (colParams.onValueChange) {
        colParams.onValueChange(val, props.rowIndex);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitAndStop(false);
      } else if (e.key === "Escape") {
        e.preventDefault();
        commitAndStop(true);
      } else if (e.key === "Tab") {
        commitAndStop(false);
      } else if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "Home" ||
        e.key === "End"
      ) {
        // Prevent AG Grid from switching active cell when navigating cursor
        e.stopPropagation();
      }
    };

    return (
      <div className="flex h-full w-full items-center">
        <NumericInput
          ref={inputRef}
          value={currentVal}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          decimals={decimals}
          align={align}
          useGrouping={useGrouping}
          locale={locale}
          className={cn(
            "h-full min-h-0 w-full rounded-none border-0 !border-none bg-transparent px-2 py-0 text-xs sm:text-sm font-normal text-slate-900 dark:text-zinc-100 !shadow-none !outline-none !ring-0 !ring-offset-0 focus:border-none focus:outline-none focus:ring-0 focus-visible:border-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
            props.className || colParams.className,
          )}
        />
      </div>
    );
  },
);

NumericalCellEditor.displayName = "NumericalCellEditor";

export const NumericalCell = NumericalCellEditor;
