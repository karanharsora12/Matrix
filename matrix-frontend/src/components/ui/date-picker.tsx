import * as React from "react";
import { format, isValid } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Matcher } from "react-day-picker";

export interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  min?: string;
  max?: string;
  displayFormat?: string;
  align?: "start" | "center" | "end";
}

function parseISODate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parts = value.split("-");
  if (parts.length !== 3) return undefined;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return undefined;
  const date = new Date(y, m - 1, d);
  return isValid(date) ? date : undefined;
}

/** Format a Date back to `YYYY-MM-DD` (local, no UTC shift). */
function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  id,
  min,
  max,
  displayFormat = "dd/MM/yyyy",
  align = "start",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(() => parseISODate(value), [value]);
  const minDate = React.useMemo(() => parseISODate(min), [min]);
  const maxDate = React.useMemo(() => parseISODate(max), [max]);

  const disabledMatchers = React.useMemo<
    Matcher | Matcher[] | undefined
  >(() => {
    const matchers: Matcher[] = [];
    if (minDate) matchers.push({ before: minDate });
    if (maxDate) {
      const endOfMax = new Date(
        maxDate.getFullYear(),
        maxDate.getMonth(),
        maxDate.getDate(),
      );
      matchers.push({ after: endOfMax });
    }
    return matchers.length ? matchers : undefined;
  }, [minDate, maxDate]);

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date ? toISODate(date) : "");
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange?.("");
  };

  const handleToday = () => {
    const today = new Date();
    if (minDate && today < minDate) {
      onChange?.(toISODate(minDate));
    } else if (maxDate && today > maxDate) {
      onChange?.(toISODate(maxDate));
    } else {
      onChange?.(toISODate(today));
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-8 w-full justify-start px-2.5 text-left text-xs font-medium shadow-xs hover:bg-accent/5",
            !selected && "font-normal text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">
            {selected ? format(selected, displayFormat) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={disabledMatchers}
          defaultMonth={selected ?? minDate ?? maxDate ?? undefined}
          startMonth={minDate ?? new Date(new Date().getFullYear() - 100, 0)}
          endMonth={maxDate ?? new Date(new Date().getFullYear() + 20, 11)}
          captionLayout="dropdown"
          autoFocus
        />
        <div className="flex items-center justify-between gap-2 border-t border-border p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClear}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleToday}
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
