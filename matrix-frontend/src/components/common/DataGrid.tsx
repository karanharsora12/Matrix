import React, { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from "ag-grid-community";
import type {
  ColDef,
  GridApi,
  GridOptions,
  IDatasource,
  IGetRowsParams,
} from "ag-grid-community";
import apiClient from "@/api/client";
import "@/styles/ag-grid.css";

ModuleRegistry.registerModules([AllCommunityModule]);

export interface DataGridProps<TData = any> {
  rowData?: TData[];
  columnDefs: ColDef[];
  gridOptions?: GridOptions;
  onGridReady?: (params: any) => void;
  pinnedBottomRowData?: any[];
  apiName?: string;
  apiInput?: Record<string, unknown>;
  infiniteScroll?: boolean;
  pageSize?: number;
}

interface GridApiResponse<TData> {
  data?: TData[];
  summary?: any[];
  pagination?: {
    total?: number;
  };
}

const getGridResponse = <TData,>(payload: unknown): GridApiResponse<TData> => {
  if (Array.isArray(payload)) return { data: payload };

  if (payload && typeof payload === "object") {
    const response = payload as GridApiResponse<TData>;
    return {
      data: Array.isArray(response.data) ? response.data : [],
      summary: Array.isArray(response.summary) ? response.summary : undefined,
      pagination: response.pagination,
    };
  }

  return { data: [] };
};

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
  wrapperBorderRadius: 0,
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
  (
    {
      rowData,
      columnDefs,
      gridOptions,
      onGridReady,
      pinnedBottomRowData,
      apiName,
      apiInput,
      infiniteScroll,
      pageSize = 50,
    },
    ref,
  ) => {
    const gridApiRef = useRef<GridApi | null>(null);
    const [apiRowData, setApiRowData] = useState<any[]>([]);
    const [apiSummary, setApiSummary] = useState<any[] | undefined>();
    const usesApi = rowData === undefined && Boolean(apiName);
    const usesInfiniteScroll = usesApi && (infiniteScroll ?? true);
    const { onGridReady: gridOptionsOnGridReady, ...restGridOptions } =
      gridOptions || {};

    const defaultColDef = useMemo<ColDef>(() => {
      return {
        filter: true,
        floatingFilter: true,
        sortable: true,
        resizable: true,
        suppressFloatingFilterButton: false,
        wrapHeaderText: true,
        autoHeaderHeight: true,
        tooltipValueGetter: (p) => p.value,
      };
    }, []);

    const isDark = document.documentElement.classList.contains("dark");
    const theme = useMemo(() => {
      return isDark ? darkTheme : lightTheme;
    }, [isDark]);

    const datasource = useMemo<IDatasource | undefined>(() => {
      if (!apiName || !usesInfiniteScroll) return undefined;

      let isDestroyed = false;

      return {
        getRows: async (params: IGetRowsParams) => {
          const requestedPageSize = params.endRow - params.startRow;
          const sort = params.sortModel[0];

          try {
            const response = await apiClient.get(apiName, {
              params: {
                ...apiInput,
                page: Math.floor(params.startRow / requestedPageSize) + 1,
                limit: requestedPageSize,
                sortField: sort?.colId,
                sortDirection: sort?.sort,
              },
            });
            if (isDestroyed) return;

            const result = getGridResponse<any>(response.data);
            if (result.summary) setApiSummary(result.summary);
            const lastRow = result.pagination?.total;
            params.successCallback(result.data || [], lastRow);
          } catch (error) {
            if (!isDestroyed) {
              console.error(`Unable to load grid data from ${apiName}`, error);
              params.failCallback();
            }
          }
        },
        destroy: () => {
          isDestroyed = true;
        },
      };
    }, [apiInput, apiName, usesInfiniteScroll]);

    useEffect(() => {
      if (!usesApi || usesInfiniteScroll || !apiName) return;

      let isCurrent = true;
      apiClient
        .get(apiName, { params: apiInput })
        .then((response) => {
          if (!isCurrent) return;
          const result = getGridResponse<any>(response.data);
          setApiRowData(result.data || []);
          setApiSummary(result.summary);
        })
        .catch((error) => {
          if (isCurrent) {
            console.error(`Unable to load grid data from ${apiName}`, error);
            setApiRowData([]);
          }
        });

      return () => {
        isCurrent = false;
      };
    }, [apiInput, apiName, usesApi, usesInfiniteScroll]);

    useEffect(() => {
      if (usesInfiniteScroll && datasource && gridApiRef.current) {
        gridApiRef.current.setGridOption("datasource", datasource);
      }
    }, [datasource, usesInfiniteScroll]);

    const handleGridReady = (params: any) => {
      gridApiRef.current = params.api;
      if (usesInfiniteScroll && datasource) {
        params.api.setGridOption("datasource", datasource);
      }
      gridOptionsOnGridReady?.(params);
      onGridReady?.(params);
    };

    const resolvedRowData =
      rowData ?? (usesInfiniteScroll ? undefined : apiRowData);

    return (
      <div className="h-full w-full ag-grid-custom">
        <AgGridReact
          ref={ref}
          theme={theme}
          rowData={resolvedRowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowModelType={usesInfiniteScroll ? "infinite" : "clientSide"}
          pagination={usesInfiniteScroll ? false : true}
          paginationPageSize={usesInfiniteScroll ? pageSize : 20}
          cacheBlockSize={usesInfiniteScroll ? pageSize : undefined}
          onGridReady={handleGridReady}
          rowSelection="single"
          animateRows={true}
          pinnedBottomRowData={pinnedBottomRowData ?? apiSummary}
          {...restGridOptions}
        />
      </div>
    );
  },
);

DataGrid.displayName = "DataGrid";
