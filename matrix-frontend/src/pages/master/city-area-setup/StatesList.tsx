import React, { useMemo } from "react";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingHeader } from "@/components/common/ListingHeader";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { useGridActions } from "@/hooks/useGridActions";
import { MenuList, getListingColumns } from "@/lib/defaults";
import { useQueryClient } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import { ListingCard } from "@/components/common/ListingCard";

const StatesList: React.FC = () => {
  const queryClient = useQueryClient();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();

  const columnDefs = useMemo<ColDef[]>(
    () => getListingColumns(MenuList.STATES, { includeAddEdit: false }),
    [],
  );

  return (
    <div className="p-3 h-full flex flex-col">
      <ListingCard>
        <ListingHeader
          title="States"
          subtitle="Manage states for city & area setup"
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ["geo-states"] })
          }
          onExportExcel={() => onExportExcel("States")}
          onExportPdf={() => onExportPdf("States List", "States")}
          onPrint={() => onPrint("States List")}
        />

        <DataGrid
          ref={gridRef}
          columnDefs={columnDefs}
          apiName={API_ENDPOINTS.GEO.STATES}
          gridOptions={{ pagination: false }}
        />
      </ListingCard>
    </div>
  );
};

export default StatesList;
