import React, { useMemo } from "react";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingHeader } from "@/components/common/ListingHeader";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { useGridActions } from "@/hooks/useGridActions";
import { MenuList, getListingColumns } from "@/lib/defaults";
import { useQueryClient } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import { ListingCard } from "@/components/common/ListingCard";

const CitiesList: React.FC = () => {
  const queryClient = useQueryClient();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();

  const columnDefs = useMemo<ColDef[]>(
    () => getListingColumns(MenuList.CITIES, { includeAddEdit: false }),
    [],
  );

  return (
    <div className="p-3 h-full flex flex-col">
      <ListingCard>
        <ListingHeader
          title="Cities"
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ["geo-cities"] })
          }
          onExportExcel={() => onExportExcel("Cities")}
          onExportPdf={() => onExportPdf("Cities List", "Cities")}
          onPrint={() => onPrint("Cities List")}
        />

        <DataGrid
          ref={gridRef}
          columnDefs={columnDefs}
          apiName={API_ENDPOINTS.GEO.CITIES}
          gridOptions={{ pagination: false }}
        />
      </ListingCard>
    </div>
  );
};

export default CitiesList;
