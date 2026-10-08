import { useDeleteSale, useSales } from "@/api/sales";
import { confirmAlert } from "@/components/common/AlertModal";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingHeader } from "@/components/common/ListingHeader";
import { WEB_ROUTES } from "@/config/webRoutes";
import { useGridActions } from "@/hooks/useGridActions";
import { MenuList, getListingColumns } from "@/lib/defaults";
import { buildRoute, encodeURL, parseNumber } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import { formatDate } from "@/utils/date";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { ListingCard } from "@/components/common/ListingCard";

const SalesList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();
  const [searchTerm, setSearchTerm] = useState("");

  const handleNavigate = (id?: number) => {
    const token = encodeURL({ id });
    navigate(buildRoute(WEB_ROUTES.TRANSACTION.SALES, { token }));
  };

  const columnDefs = useMemo<ColDef[]>(() => {
    return getListingColumns(MenuList.SALES, {
      overrides: {
        voucherDate: {
          valueGetter: (p) =>
            p.node?.rowPinned ? "" : formatDate(p.data?.voucherDate),
        },
        grandTotal: {
          valueFormatter: (p) =>
            p.node?.rowPinned ? p.value : parseNumber(p.value),
        },
      },
    });
  }, []);

  return (
    <div className="p-3 h-full flex flex-col">
      <ListingCard>
        <ListingHeader
          title="Sales"
          addText="Add Sales"
          onAdd={() => handleNavigate(0)}
          searchProps={{
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            placeholder: "Search sales...",
          }}
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ["sales"] })
          }
          onExportExcel={() => onExportExcel("Sales")}
          onExportPdf={() => onExportPdf("Sales List", "Sales")}
          onPrint={() => onPrint("Sales List")}
        />

        <DataGrid
          ref={gridRef}
          columnDefs={columnDefs}
          apiName={API_ENDPOINTS.SALES.BASE}
          gridOptions={{
            onRowDoubleClicked: (e) => {
              if (e.node.rowPinned) return;
              handleNavigate(e.data.id);
            },
            pagination: false,
          }}
        />
      </ListingCard>
    </div>
  );
};

export default SalesList;
