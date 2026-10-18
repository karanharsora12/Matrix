import React, { useMemo } from "react";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingHeader } from "@/components/common/ListingHeader";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { useGridActions } from "@/hooks/useGridActions";
import { MenuList, getListingColumns } from "@/lib/defaults";
import type { ColDef } from "ag-grid-community";
import { ListingCard } from "@/components/common/ListingCard";

const PincodesList: React.FC = () => {
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();

  const columnDefs = useMemo<ColDef[]>(
    () => getListingColumns(MenuList.PINCODES, { includeAddEdit: false }),
    [],
  );

  return (
    <div className="p-3 h-full flex flex-col">
      <ListingCard>
        <ListingHeader
          title="Pincodes"
          subtitle="Manage pincodes for city & area setup"
          onRefresh={() => gridRef.current?.api.refreshInfiniteCache()}
          onExportExcel={() => onExportExcel("Pincodes")}
          onExportPdf={() => onExportPdf("Pincodes List", "Pincodes")}
          onPrint={() => onPrint("Pincodes List")}
        />

        <DataGrid
          ref={gridRef}
          columnDefs={columnDefs}
          apiName={API_ENDPOINTS.GEO.PINCODES}
        />
      </ListingCard>
    </div>
  );
};

export default PincodesList;
