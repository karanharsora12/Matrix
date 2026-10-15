import React, { useEffect, useMemo } from "react";
import { useDaybooks, useDaybookGroups, type Daybook } from "@/api/daybooks";
import { getDaybooksForMenu, getDaybooksByMenu } from "@/constants/enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DaybookSelectProps {
  value?: number | string | null;
  onChange: (daybookId: number, daybook?: Daybook) => void;
  menuKey?: string;
  transactionMenu?: string;
  daybookGroupShortName?: string;
  daybooks?: Daybook[];
  label?: string | false;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  autoSelectFirst?: boolean;
  className?: string;
  triggerClassName?: string;
  showIcon?: boolean;
}

export const DaybookSelect: React.FC<DaybookSelectProps> = ({
  value,
  onChange,
  menuKey,
  transactionMenu,
  daybookGroupShortName,
  daybooks: customDaybooks,
  label = "Daybook",
  placeholder = "Select daybook",
  required = false,
  disabled = false,
  autoSelectFirst = false,
  className,
  triggerClassName,
  showIcon = false,
}) => {
  const { data: daybooksResponse, isLoading: isDaybooksLoading } =
    useDaybooks();
  const { data: daybookGroupsResponse, isLoading: isGroupsLoading } =
    useDaybookGroups();

  const daybookGroups = useMemo(
    () => (daybookGroupsResponse?.data || []).filter((g) => g.isActive),
    [daybookGroupsResponse?.data],
  );

  const availableDaybooks = useMemo(() => {
    if (customDaybooks) return customDaybooks;

    const allActive = (daybooksResponse?.data || []).filter((d) => d.isActive);

    if (menuKey) {
      return getDaybooksForMenu(menuKey, allActive, daybookGroups);
    }

    if (transactionMenu) {
      return getDaybooksByMenu(transactionMenu, allActive, daybookGroups);
    }

    if (daybookGroupShortName) {
      const targetGroup = daybookGroups.find(
        (g) => g.shortName === daybookGroupShortName,
      );
      if (!targetGroup) return [];
      return allActive.filter((d) => d.daybookGroupId === targetGroup.id);
    }

    return allActive;
  }, [
    customDaybooks,
    daybooksResponse?.data,
    menuKey,
    transactionMenu,
    daybookGroupShortName,
    daybookGroups,
  ]);

  const selectedId = Number(value || 0);

  useEffect(() => {
    if (
      autoSelectFirst &&
      !selectedId &&
      availableDaybooks.length > 0 &&
      !disabled
    ) {
      const first = availableDaybooks[0];
      onChange(first.id, first);
    }
  }, [autoSelectFirst, selectedId, availableDaybooks, disabled, onChange]);

  const isLoading = isDaybooksLoading || isGroupsLoading;

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <Label className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-zinc-300">
          {showIcon && <BookOpen className="h-3.5 w-3.5 text-slate-400" />}
          {label} {required && <span className="text-rose-500">*</span>}
        </Label>
      )}

      <Select
        disabled={disabled || isLoading || availableDaybooks.length === 0}
        value={selectedId ? String(selectedId) : ""}
        onValueChange={(val) => {
          const numId = Number(val);
          const found = availableDaybooks.find((d) => d.id === numId);
          onChange(numId, found);
        }}
      >
        <SelectTrigger
          className={cn(
            "h-9 text-xs font-medium border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
            triggerClassName,
          )}
        >
          <SelectValue placeholder={isLoading ? "Loading…" : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {availableDaybooks.length > 0 ? (
            availableDaybooks.map((db) => (
              <SelectItem
                key={db.id}
                value={String(db.id)}
                className="text-xs font-medium"
              >
                {db.daybookName}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled className="text-xs">
              No daybooks available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
