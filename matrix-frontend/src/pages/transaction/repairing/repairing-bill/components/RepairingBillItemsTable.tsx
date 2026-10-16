import React from "react";
import { Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataGrid } from "@/components/common/DataGrid";
import type { CellValueChangedEvent, ColDef } from "ag-grid-community";
import type { RepairingBillLine } from "../types";

interface RepairingBillItemsTableProps {
  readOnly: boolean;
  lines: RepairingBillLine[];
  lineColumns: ColDef<RepairingBillLine>[];
  gridTotals: any[];
  onAddLine: () => void;
  onCellValueChanged: (e: CellValueChangedEvent<RepairingBillLine>) => void;
}

export const RepairingBillItemsTable: React.FC<
  RepairingBillItemsTableProps
> = ({
  readOnly,
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
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <Wrench className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                Billable Repair Items & Charges
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
              Enter billable item materials, labour charges, and delivery notes
            </span>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={onAddLine}
              className="h-8 gap-1.5 bg-primary-action px-3 text-xs font-semibold text-white hover:bg-primary-action/90 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Add Item
            </Button>
          </div>
        )}
      </div>

      <div className="h-[320px] min-h-[260px] w-full no-radius rounded-none overflow-hidden">
        <DataGrid
          className="no-radius"
          rowData={lines}
          columnDefs={lineColumns}
          pinnedBottomRowData={gridTotals}
          gridOptions={{
            pagination: false,
            singleClickEdit: !readOnly,
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
