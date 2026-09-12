import { useDeleteSale, useSales } from "@/api/sales";
import { confirmAlert } from "@/components/common/AlertModal";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingHeader } from "@/components/common/ListingHeader";
import { WEB_ROUTES } from "@/config/webRoutes";
import { useGridActions } from "@/hooks/useGridActions";
import { MenuList, getListingColumns } from "@/lib/defaults";
import { buildRoute, encodeURL } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const SalesList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: salesResponse, isLoading } = useSales();
  const deleteMutation = useDeleteSale();
  const sales = salesResponse?.data || [];

  const handleNavigate = (id?: number) => {
    const token = encodeURL({ id });
    navigate(buildRoute(WEB_ROUTES.TRANSACTION.SALES, { token }));
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmAlert({
      title: "Confirm Delete",
      description:
        "Are you sure you want to delete this sales voucher? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  const filteredData = sales.filter((sale) => {
    const q = searchTerm.toLowerCase();
    return (
      sale.voucherNo?.toLowerCase().includes(q) ||
      sale.daybookName?.toLowerCase().includes(q) ||
      sale.reference?.toLowerCase().includes(q)
    );
  });

  const columnDefs = useMemo<ColDef[]>(() => {
    return getListingColumns(MenuList.SALES, {
      overrides: {
        voucherDate: {
          valueGetter: (p) =>
            p.node?.rowPinned ? "" : p.data?.voucherDate?.slice(0, 10),
        },
        grandTotal: {
          valueFormatter: (p) =>
            p.node?.rowPinned
              ? p.value
              : (p.value || 0).toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                  minimumFractionDigits: 2,
                }),
        },
      },
    });
  }, []);

  const summary = useMemo(() => {
    const total = sales.reduce((s, x) => s + (x.grandTotal || 0), 0);
    return [
      {
        daybookName: "TOTAL",
        grandTotal: total.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2,
        }),
      },
    ];
  }, [sales]);

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <ListingHeader
        title="Sales"
        addText="Add Sales"
        onAdd={() => handleNavigate(0)}
        searchProps={{
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          placeholder: "Search sales...",
        }}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["sales"] })}
        onExportExcel={() => onExportExcel("Sales")}
        onExportPdf={() => onExportPdf("Sales List", "Sales")}
        onPrint={() => onPrint("Sales List")}
      />

      <DataGrid
        ref={gridRef}
        rowData={filteredData}
        columnDefs={columnDefs}
        pinnedBottomRowData={summary}
        gridOptions={{
          onRowDoubleClicked: (e) => {
            if (e.node.rowPinned) return;
            handleNavigate(e.data.id);
          },
          pagination: false,
        }}
      />
    </div>
  );
};

export default SalesList;
