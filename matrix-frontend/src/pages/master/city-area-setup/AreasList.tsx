import React, { useMemo } from "react";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingHeader } from "@/components/common/ListingHeader";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { useGridActions } from "@/hooks/useGridActions";
import { MenuList, getListingColumns } from "@/lib/defaults";
import { useQueryClient } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";

const AreasList: React.FC = () => {
  const queryClient = useQueryClient();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();

  const columnDefs = useMemo<ColDef[]>(
    () => getListingColumns(MenuList.AREAS, { includeAddEdit: false }),
    [],
  );

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <ListingHeader
        title="Areas"
        subtitle="Manage areas for city & area setup"
        onRefresh={() =>
          queryClient.invalidateQueries({ queryKey: ["geo-areas"] })
        }
        onExportExcel={() => onExportExcel("Areas")}
        onExportPdf={() => onExportPdf("Areas List", "Areas")}
        onPrint={() => onPrint("Areas List")}
      />

      <DataGrid
        ref={gridRef}
        columnDefs={columnDefs}
        apiName={API_ENDPOINTS.GEO.AREAS}
        gridOptions={{ pagination: false }}
      />
    </div>
  );
};

export default AreasList;
