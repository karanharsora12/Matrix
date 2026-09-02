import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from "ag-grid-community";
import type { ColDef, GridOptions } from "ag-grid-community";
import "@/styles/ag-grid.css";

// Register all community modules
ModuleRegistry.registerModules([AllCommunityModule]);

export interface DataGridProps {
  rowData: any[];
  columnDefs: ColDef[];
  gridOptions?: GridOptions;
  onGridReady?: (params: any) => void;
}

// Light theme — tuned to match the app's zinc-based palette
const lightTheme = themeQuartz.withParams({
  backgroundColor: "hsl(0 0% 100%)",
  foregroundColor: "hsl(240 10% 3.9%)",
  headerBackgroundColor: "hsl(240 4.8% 95.9%)",
  headerFontWeight: 600,
  headerFontSize: 13,
  fontSize: 13,
  borderColor: "hsl(240 5.9% 90%)",
  rowBorder: true,
  columnBorder: true,
  rowHoverColor: "hsl(240 4.8% 96.5%)",
  selectedRowBackgroundColor: "hsl(217 91% 96%)",
  oddRowBackgroundColor: "hsl(0 0% 100%)",
  borderRadius: 6,
  wrapperBorderRadius: 8,
  cellHorizontalPadding: 12,
  headerCellHoverBackgroundColor: "hsl(240 4.8% 92%)",
  filterToolPanelGroupIndent: 12,
  iconSize: 16,
  spacing: 4,
  wrapperBorder: true,
  headerColumnBorder: true,
  headerColumnBorderHeight: "100%",
});

// Dark theme — matches the app's dark zinc palette
const darkTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: "hsl(240 10% 5.5%)",
  foregroundColor: "hsl(0 0% 98%)",
  headerBackgroundColor: "hsl(240 5% 14%)",
  headerFontWeight: 600,
  headerFontSize: 13,
  fontSize: 13,
  borderColor: "hsl(240 3.7% 17%)",
  rowBorder: true,
  columnBorder: true,
  rowHoverColor: "hsl(240 5% 14%)",
  selectedRowBackgroundColor: "hsl(217 50% 18%)",
  oddRowBackgroundColor: "hsl(240 10% 5.5%)",
  borderRadius: 6,
  wrapperBorderRadius: 8,
  cellHorizontalPadding: 12,
  headerCellHoverBackgroundColor: "hsl(240 4% 20%)",
  filterToolPanelGroupIndent: 12,
  iconSize: 16,
  spacing: 4,
  wrapperBorder: true,
  headerColumnBorder: true,
  headerColumnBorderHeight: "100%",
});

export const DataGrid = React.forwardRef<AgGridReact, DataGridProps>(
  ({ rowData, columnDefs, gridOptions, onGridReady }, ref) => {
    const defaultColDef = useMemo<ColDef>(() => {
      return {
        flex: 1,
        minWidth: 100,
        filter: true,
        floatingFilter: true,
        sortable: true,
        resizable: true,
        suppressFloatingFilterButton: false,
      };
    }, []);

    const isDark = document.documentElement.classList.contains("dark");
    const theme = useMemo(() => {
      return isDark ? darkTheme : lightTheme;
    }, [isDark]);

    return (
      <div className="h-full w-full ag-grid-custom">
        <AgGridReact
          ref={ref}
          theme={theme}
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
  },
);

DataGrid.displayName = "DataGrid";
