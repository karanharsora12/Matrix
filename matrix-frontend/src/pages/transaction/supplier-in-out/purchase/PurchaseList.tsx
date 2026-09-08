import { useDeletePurchase, usePurchases } from "@/api/purchase";
import { confirmAlert } from "@/components/common/AlertModal";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingHeader } from "@/components/common/ListingHeader";
import { WEB_ROUTES } from "@/config/webRoutes";
import { useGridActions } from "@/hooks/useGridActions";
import { buildRoute, encodeURL } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const PurchaseList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: purchasesResponse, isLoading } = usePurchases();
  const deleteMutation = useDeletePurchase();
  const purchases = purchasesResponse?.data || [];

  const handleNavigate = (id?: number) => {
    const token = encodeURL({ id });
    navigate(buildRoute(WEB_ROUTES.TRANSACTION.PURCHASE, { token }));
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmAlert({
      title: "Confirm Delete",
      description:
        "Are you sure you want to delete this purchase voucher? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  const filteredData = purchases.filter((purchase) => {
    const q = searchTerm.toLowerCase();
    return (
      purchase.voucherNo?.toLowerCase().includes(q) ||
      purchase.daybookName?.toLowerCase().includes(q) ||
      purchase.reference?.toLowerCase().includes(q) ||
      purchase.accountName?.toLowerCase().includes(q)
    );
  });

  const columnDefs = useMemo<ColDef[]>(() => {
    return [
      { field: "voucherNo", headerName: "Voucher No.", width: 120 },
      {
        field: "voucherDate",
        headerName: "Voucher Date",
        width: 110,
        valueGetter: (p) =>
          p.node?.rowPinned ? "" : p.data?.voucherDate?.slice(0, 10),
      },
      { field: "daybookGroupName", headerName: "Daybook Group", width: 120 },
      { field: "daybookName", headerName: "Daybook", width: 160 },
      {
        field: "accountName",
        headerName: "Supplier Name",
        width: 250,
      },
      {
        field: "discountAmount",
        headerName: "Disc. Amount",
        width: 100,
        type: "numericColumn",
      },
      {
        field: "kasarAmount",
        headerName: "Kasar Amount",
        width: 100,
        type: "numericColumn",
      },
      {
        field: "roundOff",
        headerName: "ROF Amount",
        width: 100,
        type: "numericColumn",
      },
      {
        field: "taxAmount",
        headerName: "Tax Amount",
        width: 100,
        type: "numericColumn",
      },
      {
        field: "tdsAmount",
        headerName: "TDS Amount",
        width: 100,
        type: "numericColumn",
      },
      {
        field: "grandTotal",
        headerName: "Amount",
        width: 100,
        type: "numericColumn",
        valueFormatter: (p) =>
          p.node?.rowPinned
            ? p.value
            : (p.value || 0).toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2,
              }),
      },
      { field: "purchaserName", headerName: "Purchaser", width: 150 },
      { field: "remarks", headerName: "Remarks", width: 150 },
    ];
  }, [handleDelete]);

  const summary = useMemo(() => {
    const total = purchases.reduce((s, x) => s + (x.grandTotal || 0), 0);
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
  }, [purchases]);

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <ListingHeader
        title="Purchase"
        addText="Add Purchase"
        onAdd={() => handleNavigate(0)}
        searchProps={{
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          placeholder: "Search purchase vouchers...",
        }}
        onRefresh={() =>
          queryClient.invalidateQueries({ queryKey: ["purchases"] })
        }
        onExportExcel={() => onExportExcel("Purchase")}
        onExportPdf={() => onExportPdf("Purchase List", "Purchase")}
        onPrint={() => onPrint("Purchase List")}
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

export default PurchaseList;
