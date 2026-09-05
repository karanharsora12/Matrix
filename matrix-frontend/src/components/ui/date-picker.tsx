import React, { useRef } from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  min?: string;
  max?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  id,
  min,
  max,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    if (disabled) return;
    if (inputRef.current) {
      if (typeof inputRef.current.showPicker === "function") {
        inputRef.current.showPicker();
      } else {
        inputRef.current.focus();
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
  };

  const formattedDisplay = React.useMemo(() => {
    if (!value) return null;
    try {
      const parts = value.split("-");
      if (parts.length === 3) {
        const d = new Date(
          Number(parts[0]),
          Number(parts[1]) - 1,
          Number(parts[2]),
        );
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        }
      }
      return value;
    } catch {
      return value;
    }
  }, [value]);

  return (
    <div
      onClick={handleContainerClick}
      className={cn(
        "relative flex h-8 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs transition-colors hover:bg-accent/5 hover:text-accent-foreground focus-within:ring-1 focus-within:ring-ring focus-within:border-ring",
        disabled && "cursor-not-allowed opacity-50 hover:bg-background",
        className,
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden text-left">
        <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span
          className={cn(
            "truncate font-medium",
            !value && "text-muted-foreground font-normal",
          )}
        >
          {formattedDisplay || placeholder}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {value && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-5 w-5 rounded-full p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear date</span>
          </Button>
        )}
      </div>

      {/* Hidden native input for accessible picker dialog */}
      <input
        ref={inputRef}
        type="date"
        id={id}
        value={value || ""}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
};

export default DatePicker;
