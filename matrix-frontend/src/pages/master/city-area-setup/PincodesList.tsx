import React, { useMemo } from "react";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingHeader } from "@/components/common/ListingHeader";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { useGridActions } from "@/hooks/useGridActions";
import { MenuList, getListingColumns } from "@/lib/defaults";
import { useQueryClient } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";

const PincodesList: React.FC = () => {
  const queryClient = useQueryClient();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();

  const columnDefs = useMemo<ColDef[]>(
    () => getListingColumns(MenuList.PINCODES, { includeAddEdit: false }),
    [],
  );

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <ListingHeader
        title="Pincodes"
        subtitle="Manage pincodes for city & area setup"
        onRefresh={() =>
          queryClient.invalidateQueries({ queryKey: ["geo-pincodes"] })
        }
        onExportExcel={() => onExportExcel("Pincodes")}
        onExportPdf={() => onExportPdf("Pincodes List", "Pincodes")}
        onPrint={() => onPrint("Pincodes List")}
      />

      <DataGrid
        ref={gridRef}
        columnDefs={columnDefs}
        apiName={API_ENDPOINTS.GEO.PINCODES}
        gridOptions={{ pagination: false }}
      />
    </div>
  );
};

export default PincodesList;
