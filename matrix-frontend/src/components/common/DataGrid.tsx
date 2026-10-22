import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import "@/styles/ag-grid.css";

ModuleRegistry.registerModules([AllCommunityModule]);

export interface DataGridProps<TData = any> {
  className?: string;
  rowData?: TData[];
  columnDefs: ColDef[];
  gridOptions?: GridOptions;
  onGridReady?: (params: any) => void;
  pinnedBottomRowData?: any[];
  apiName?: string;
  apiInput?: Record<string, unknown>;
  infiniteScroll?: boolean;
  pagination?: boolean;
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

const createGridTheme = (isDark: boolean, accentHex: string) => {
  if (isDark) {
    const headerBg = `color-mix(in srgb, ${accentHex} 14%, hsl(240 10% 8%))`;
    return themeQuartz.withPart(colorSchemeDark).withParams({
      backgroundColor: "hsl(240 10% 5.5%)",
      foregroundColor: "hsl(0 0% 98%)",
      headerBackgroundColor: headerBg,
      headerTextColor: "hsl(0 0% 98%)",
      headerFontWeight: 600,
      headerFontSize: 13,
      fontSize: 13,
      borderColor: "hsl(240 3.7% 17%)",
      accentColor: accentHex,
      rowBorder: true,
      columnBorder: true,
      rowHoverColor: `color-mix(in srgb, ${accentHex} 10%, black)`,
      selectedRowBackgroundColor: `color-mix(in srgb, ${accentHex} 22%, black)`,
      rangeSelectionBackgroundColor: `color-mix(in srgb, ${accentHex} 18%, black)`,
      rangeSelectionBorderColor: accentHex,
      oddRowBackgroundColor: "hsl(240 7% 9%)",
      borderRadius: 6,
      wrapperBorderRadius: 8,
      cellHorizontalPadding: 12,
      headerCellHoverBackgroundColor: `color-mix(in srgb, ${accentHex} 22%, hsl(240 10% 8%))`,
      filterToolPanelGroupIndent: 12,
      iconSize: 16,
      spacing: 4,
      wrapperBorder: true,
      headerColumnBorder: true,
      headerColumnBorderHeight: "100%",
    });
  }

  const headerBg = `color-mix(in srgb, ${accentHex} 9%, #ffffff)`;
  return themeQuartz.withParams({
    backgroundColor: "hsl(0 0% 100%)",
    foregroundColor: "hsl(240 10% 3.9%)",
    headerBackgroundColor: headerBg,
    headerTextColor: "hsl(240 10% 3.9%)",
    headerFontWeight: 600,
    headerFontSize: 13,
    fontSize: 13,
    borderColor: "hsl(240 5.9% 90%)",
    accentColor: accentHex,
    rowBorder: true,
    columnBorder: true,
    rowHoverColor: `color-mix(in srgb, ${accentHex} 5%, white)`,
    selectedRowBackgroundColor: `color-mix(in srgb, ${accentHex} 12%, white)`,
    rangeSelectionBackgroundColor: `color-mix(in srgb, ${accentHex} 15%, white)`,
    rangeSelectionBorderColor: accentHex,
    oddRowBackgroundColor: "hsl(240 5% 97.2%)",
    borderRadius: 6,
    wrapperBorderRadius: 6,
    cellHorizontalPadding: 12,
    headerCellHoverBackgroundColor: `color-mix(in srgb, ${accentHex} 15%, white)`,
    filterToolPanelGroupIndent: 12,
    iconSize: 16,
    spacing: 4,
    wrapperBorder: true,
    headerColumnBorder: true,
    headerColumnBorderHeight: "100%",
  });
};

export const DataGrid = React.forwardRef<AgGridReact, DataGridProps>(
  (
    {
      className,
      rowData,
      columnDefs,
      gridOptions,
      onGridReady,
      pinnedBottomRowData,
      apiName,
      apiInput,
      infiniteScroll = true,
      pagination = false,
      pageSize = 50,
    },
    ref,
  ) => {
    const gridApiRef = useRef<GridApi | null>(null);
    const apiInputRef = useRef(apiInput);
    apiInputRef.current = apiInput;

    const [apiRowData, setApiRowData] = useState<any[]>([]);
    const [apiSummary, setApiSummary] = useState<any[] | undefined>();
    const usesApi = rowData === undefined && Boolean(apiName);
    const usesInfiniteScroll = usesApi && infiniteScroll;
    const isPaginationEnabled = !usesInfiniteScroll && pagination === true;

    const {
      onGridReady: gridOptionsOnGridReady,
      pagination: _gridOptPagination,
      ...restGridOptions
    } = gridOptions || {};

    const defaultColDef = useMemo<ColDef>(() => {
      return {
        cellDataType: false,
        filter: true,
        floatingFilter: true,
        sortable: true,
        resizable: true,
        suppressFloatingFilterButton: false,
        wrapHeaderText: true,
        autoHeaderHeight: true,
        filterParams: {
          debounceMs: 400,
        },
        tooltipValueGetter: (p) => p.value,
      };
    }, []);

    const dataTypeDefinitions = useMemo(
      () => ({
        number: {
          baseDataType: "number" as const,
          extendsDataType: "number" as const,
          valueFormatter: (params: any) => {
            if (params.value == null) return "";
            if (typeof params.value !== "number" || isNaN(params.value)) {
              return String(params.value);
            }
            return String(params.value);
          },
        },
        date: {
          baseDataType: "date" as const,
          extendsDataType: "date" as const,
          valueFormatter: (params: any) => {
            if (params.value == null) return "";
            if (
              !(params.value instanceof Date) ||
              isNaN(params.value.getTime())
            ) {
              return String(params.value);
            }
            return params.value.toLocaleDateString();
          },
        },
      }),
      [],
    );

    const { resolvedMode, activeHex } = useTheme();
    const theme = useMemo(() => {
      return createGridTheme(resolvedMode === "dark", activeHex || "#3B82A0");
    }, [resolvedMode, activeHex]);

    const serializedApiInput = useMemo(
      () => JSON.stringify(apiInput ?? {}),
      [apiInput],
    );

    const isInitialMount = useRef(true);

    const buildSummaryRow = useCallback(
      (totalRecords: number | undefined, backendSummary: any[] | undefined) => {
        if (!backendSummary && totalRecords === undefined) return undefined;

        const firstVisibleCol = columnDefs.find(
          (col) =>
            col.field &&
            !col.hide &&
            col.field !== "action" &&
            col.field !== "actions",
        );
        const firstColField =
          firstVisibleCol?.field || columnDefs[0]?.field || "id";

        const summaryObj: Record<string, any> = {};

        // Merge only the fields provided in summary
        if (Array.isArray(backendSummary) && backendSummary[0]) {
          Object.assign(summaryObj, backendSummary[0]);
        }

        // At end of first column, display total records if not already set
        if (totalRecords !== undefined && !summaryObj[firstColField]) {
          summaryObj[firstColField] =
            `Total: ${Number(totalRecords).toLocaleString()}`;
        }

        return Object.keys(summaryObj).length > 0 ? [summaryObj] : undefined;
      },
      [columnDefs],
    );

    const datasource = useMemo<IDatasource | undefined>(() => {
      if (!apiName || !usesInfiniteScroll) return undefined;

      let isDestroyed = false;

      return {
        getRows: async (params: IGetRowsParams) => {
          const requestedPageSize = params.endRow - params.startRow;
          const sort = params.sortModel?.[0];

          try {
            const response = await apiClient.post(apiName, {
              ...(apiInputRef.current || {}),
              page: Math.floor(params.startRow / requestedPageSize) + 1,
              limit: requestedPageSize,
              offset: params.startRow,
              sortField: sort?.colId,
              sortDirection: sort?.sort,
              filterModel: params.filterModel,
              sortModel: params.sortModel,
            });
            if (isDestroyed) return;

            const result = getGridResponse<any>(response.data);
            const rawTotal = result.pagination?.total;
            const total =
              rawTotal !== undefined &&
              rawTotal !== null &&
              Number.isFinite(Number(rawTotal))
                ? Number(rawTotal)
                : undefined;

            const fetchedRows = result.data || [];
            const summaryRows = buildSummaryRow(total, result.summary);
            setApiSummary(summaryRows);
            if (gridApiRef.current) {
              gridApiRef.current.setGridOption(
                "pinnedBottomRowData",
                summaryRows || [],
              );
            }

            const lastRow =
              total !== undefined
                ? total
                : fetchedRows.length < requestedPageSize
                  ? params.startRow + fetchedRows.length
                  : -1;

            params.successCallback(fetchedRows, lastRow);
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
    }, [apiName, usesInfiniteScroll, buildSummaryRow]);

    // On client-side data fetch (when infinite scroll is disabled)
    useEffect(() => {
      if (!usesApi || usesInfiniteScroll || !apiName) return;

      let isCurrent = true;
      apiClient
        .post(apiName, apiInput)
        .then((response) => {
          if (!isCurrent) return;
          const result = getGridResponse<any>(response.data);
          const fetchedRows = result.data || [];
          setApiRowData(fetchedRows);
          const summaryRows = buildSummaryRow(
            result.pagination?.total ??
              (result.summary ? undefined : fetchedRows.length),
            result.summary,
          );
          setApiSummary(summaryRows);
          if (gridApiRef.current) {
            gridApiRef.current.setGridOption(
              "pinnedBottomRowData",
              summaryRows || [],
            );
          }
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
    }, [
      serializedApiInput,
      apiName,
      usesApi,
      usesInfiniteScroll,
      buildSummaryRow,
    ]);

    // Purge cache when external filter inputs change (e.g. search box)
    useEffect(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      if (gridApiRef.current && usesInfiniteScroll) {
        gridApiRef.current.purgeInfiniteCache();
      }
    }, [serializedApiInput, usesInfiniteScroll]);

    const resolvedPinnedBottomRowData = useMemo(() => {
      if (pinnedBottomRowData) return pinnedBottomRowData;
      if (apiSummary) return apiSummary;
      if (rowData && Array.isArray(rowData)) {
        return buildSummaryRow(rowData.length, undefined);
      }
      return undefined;
    }, [pinnedBottomRowData, apiSummary, rowData, buildSummaryRow]);

    const handleGridReady = (params: any) => {
      gridApiRef.current = params.api;
      if (resolvedPinnedBottomRowData) {
        params.api.setGridOption(
          "pinnedBottomRowData",
          resolvedPinnedBottomRowData,
        );
      }
      gridOptionsOnGridReady?.(params);
      onGridReady?.(params);
    };

    const resolvedRowData =
      rowData ?? (usesInfiniteScroll ? undefined : apiRowData);

    return (
      <div
        className={cn("flex-1 min-h-0 h-full w-full ag-grid-custom", className)}
      >
        <AgGridReact
          ref={ref}
          theme={theme}
          rowData={resolvedRowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          dataTypeDefinitions={dataTypeDefinitions}
          rowModelType={usesInfiniteScroll ? "infinite" : "clientSide"}
          datasource={usesInfiniteScroll ? datasource : undefined}
          pagination={isPaginationEnabled}
          suppressPaginationPanel={usesInfiniteScroll || !isPaginationEnabled}
          paginationPageSize={isPaginationEnabled ? pageSize : undefined}
          paginationPageSizeSelector={
            isPaginationEnabled ? [20, 50, 100, 200] : undefined
          }
          cacheBlockSize={pageSize}
          cacheOverflowSize={2}
          maxConcurrentDatasourceRequests={1}
          maxBlocksInCache={50}
          onGridReady={handleGridReady}
          rowSelection="single"
          animateRows={true}
          rowHeight={38}
          headerHeight={44}
          pinnedBottomRowData={resolvedPinnedBottomRowData}
          {...restGridOptions}
        />
      </div>
    );
  },
);

DataGrid.displayName = "DataGrid";
