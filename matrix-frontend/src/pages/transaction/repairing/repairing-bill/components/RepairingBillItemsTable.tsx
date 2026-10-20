import React from "react";
import { DataGrid } from "@/components/common/DataGrid";
import type { CellValueChangedEvent, ColDef } from "ag-grid-community";
import type { RepairingBillLine } from "../types";

interface RepairingBillItemsTableProps {
  readOnly: boolean;
  lines: RepairingBillLine[];
  lineColumns: ColDef<RepairingBillLine>[];
  gridTotals: any[];
  onCellValueChanged: (e: CellValueChangedEvent<RepairingBillLine>) => void;
}

export const RepairingBillItemsTable: React.FC<
  RepairingBillItemsTableProps
> = ({
  readOnly,
  lines,
  lineColumns,
  gridTotals,
  onCellValueChanged,
}) => {
  return (
    <section className="mt-4 flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                Billable Repair Items & Charges
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[320px] min-h-[260px] w-full no-radius rounded-none overflow-hidden">
        <DataGrid
          className="no-radius"
          rowData={lines}
          columnDefs={lineColumns}
          pinnedBottomRowData={lines.length > 0 ? gridTotals : undefined}
          gridOptions={{
            pagination: false,
            singleClickEdit: !readOnly,
            getRowId: (params) => params.data.key,
            onCellValueChanged,
            overlayNoRowsTemplate:
              '<span class="text-xs text-slate-400 dark:text-zinc-500">No repair items. Please select a Repairing Receipt above to load items.</span>',
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
