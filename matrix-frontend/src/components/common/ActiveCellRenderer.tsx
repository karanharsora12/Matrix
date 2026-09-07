import React from "react";
import type { ICellRendererParams } from "ag-grid-community";
import { cn } from "@/lib/utils";

export const ActiveCellRenderer: React.FC<ICellRendererParams> = (params) => {
  if (params.node?.rowPinned) return null;
  if (params.value === undefined || params.value === null) return null;

  const isActive =
    params.value === true ||
    params.value === "true" ||
    params.value === 1 ||
    params.value === "1";

  return (
    <div className="flex h-full w-full items-center justify-center">
      <span
        className={cn(
          "relative flex h-3 w-3 items-center justify-center",
        )}
        title={isActive ? "Active" : "Inactive"}
      >
        <span
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            isActive
              ? "bg-emerald-500 dark:bg-emerald-400"
              : "bg-zinc-400 dark:bg-zinc-500",
          )}
        />
      </span>
    </div>
  );
};