import React, { useMemo } from "react";
import { Plus, Wrench, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataGrid } from "@/components/common/DataGrid";
import type { CellValueChangedEvent, ColDef } from "ag-grid-community";
import type { RepairLine } from "../types";
import { n } from "../types";

interface RepairItemsTableProps {
  readOnly: boolean;
  lines: RepairLine[];
  lineColumns: ColDef<RepairLine>[];
  gridTotals: any[];
  onAddLine: () => void;
  onCellValueChanged: (e: CellValueChangedEvent<RepairLine>) => void;
}

export const RepairItemsTable: React.FC<RepairItemsTableProps> = ({
  lines,
  lineColumns,
  gridTotals,
  onAddLine,
  onCellValueChanged,
}) => {
  return (
    <section className="mt-4 flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
      {/* ── Table Header Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <Wrench className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                Repair Items
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={onAddLine}
            className="h-8 gap-1.5 bg-primary-action px-3 text-xs font-semibold text-white hover:bg-primary-action/90 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Add Item
          </Button>
        </div>
      </div>

      {/* ── AG Grid Table Container ── */}
      <div className="h-[320px] min-h-[260px] w-full">
        <DataGrid
          rowData={lines}
          columnDefs={lineColumns}
          pinnedBottomRowData={gridTotals}
          gridOptions={{
            pagination: false,
            singleClickEdit: true,
            getRowId: (params) => params.data.key,
            onCellValueChanged,
            defaultColDef: {
              sortable: false,
              filter: false,
              floatingFilter: false,
              resizable: true,
            },
          }}
        />
      </div>
    </section>
  );
};
