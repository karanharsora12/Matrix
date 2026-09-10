import { usePayments } from "@/api/payments";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingHeader } from "@/components/common/ListingHeader";
import { WEB_ROUTES } from "@/config/webRoutes";
import { TransactionType } from "@/constants/enums";
import { useGridActions } from "@/hooks/useGridActions";
import { buildRoute, encodeURL } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const CashReceiptList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: paymentsResponse } = usePayments({
    transactionType: TransactionType.CREC,
  });
  const receipts = paymentsResponse?.data || [];

  const handleNavigate = (id?: number) => {
    const token = encodeURL({ id });
    navigate(buildRoute(WEB_ROUTES.TRANSACTION.CASH_RECEIPT, { token }));
  };

  const filteredData = receipts.filter((receipt) => {
    const q = searchTerm.toLowerCase();
    return (
      receipt.voucherNo?.toLowerCase().includes(q) ||
      receipt.daybookName?.toLowerCase().includes(q) ||
      receipt.accountName?.toLowerCase().includes(q) ||
      receipt.remarks?.toLowerCase().includes(q)
    );
  });

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: "voucherNo", headerName: "Voucher No.", width: 130 },
      {
        field: "voucherDate",
        headerName: "Voucher Date",
        width: 120,
        valueGetter: (p) =>
          p.node?.rowPinned ? "" : p.data?.voucherDate?.slice(0, 10),
      },
      { field: "daybookName", headerName: "Daybook", width: 180 },
      { field: "accountName", headerName: "Account", width: 250 },
      {
        field: "totalAmount",
        headerName: "Amount",
        width: 140,
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
      { field: "reference", headerName: "Type", width: 130 },
      { field: "remarks", headerName: "Narration", width: 200 },
    ],
    [],
  );

  const summary = useMemo(() => {
    const total = receipts.reduce((s, x) => s + (x.totalAmount || 0), 0);
    return [
      {
        daybookName: "TOTAL",
        totalAmount: total.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2,
        }),
      },
    ];
  }, [receipts]);

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <ListingHeader
        title="Cash Receipt"
        addText="Add Cash Receipt"
        onAdd={() => handleNavigate(0)}
        searchProps={{
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          placeholder: "Search cash receipt vouchers...",
        }}
        onRefresh={() =>
          queryClient.invalidateQueries({ queryKey: ["payments"] })
        }
        onExportExcel={() => onExportExcel("CashReceipt")}
        onExportPdf={() => onExportPdf("Cash Receipt", "CashReceipt")}
        onPrint={() => onPrint("Cash Receipt")}
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

export default CashReceiptList;
