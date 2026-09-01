import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from "ag-grid-community";
import type { ColDef, GridOptions } from "ag-grid-community";
// Register all community modules
ModuleRegistry.registerModules([AllCommunityModule]);

export interface DataGridProps {
  rowData: any[];
  columnDefs: ColDef[];
  gridOptions?: GridOptions;
  onGridReady?: (params: any) => void;
}

export const DataGrid: React.FC<DataGridProps> = ({
  rowData,
  columnDefs,
  gridOptions,
  onGridReady,
}) => {
  const defaultColDef = useMemo<ColDef>(() => {
    return {
      flex: 1,
      minWidth: 100,
      filter: true,
      sortable: true,
      resizable: true,
    };
  }, []);

  const isDark = document.documentElement.classList.contains("dark");
  const myTheme = useMemo(() => {
    return isDark ? themeQuartz.withPart(colorSchemeDark) : themeQuartz;
  }, [isDark]);

  return (
    <div className="h-full w-full">
      <AgGridReact
        theme={myTheme}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pagination={true}
        paginationPageSize={20}
        onGridReady={onGridReady}
        rowSelection="single"
        animateRows={true}
        {...gridOptions}
      />
    </div>
  );
};
