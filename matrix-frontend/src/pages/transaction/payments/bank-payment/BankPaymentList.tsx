import { MenuList, getListingColumns } from "@/lib/defaults";
import { usePayments } from "@/api/payments";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingHeader } from "@/components/common/ListingHeader";
import { WEB_ROUTES } from "@/config/webRoutes";
import { TransactionType } from "@/constants/enums";
import { useGridActions } from "@/hooks/useGridActions";
import { buildRoute, encodeURL } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import { formatDate } from "@/utils/date";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListingCard } from "@/components/common/ListingCard";

const BankPaymentList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: paymentsResponse } = usePayments({
    transactionType: TransactionType.BPAY,
  });
  const payments = paymentsResponse?.data || [];

  const handleNavigate = (id?: number) => {
    const token = encodeURL({ id });
    navigate(buildRoute(WEB_ROUTES.TRANSACTION.BANK_PAYMENT, { token }));
  };

  const filteredData = payments.filter((payment) => {
    const q = searchTerm.toLowerCase();
    return (
      payment.voucherNo?.toLowerCase().includes(q) ||
      payment.daybookName?.toLowerCase().includes(q) ||
      payment.accountName?.toLowerCase().includes(q) ||
      payment.remarks?.toLowerCase().includes(q)
    );
  });

  const columnDefs = useMemo<ColDef[]>(
    () =>
      getListingColumns(MenuList.BANK_PAYMENT, {
        overrides: {
          voucherDate: {
            valueGetter: (p) =>
              p.node?.rowPinned ? "" : formatDate(p.data?.voucherDate),
          },
          totalAmount: {
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
      }),
    [],
  );

  const summary = useMemo(() => {
    const total = payments.reduce((s, x) => s + (x.totalAmount || 0), 0);
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
  }, [payments]);

  return (
    <div className="p-3 h-full flex flex-col">
      <ListingCard>
        <ListingHeader
          title="Bank Payment"
          addText="Add Bank Payment"
          onAdd={() => handleNavigate(0)}
          searchProps={{
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            placeholder: "Search bank payment vouchers...",
          }}
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ["payments"] })
          }
          onExportExcel={() => onExportExcel("BankPayment")}
          onExportPdf={() => onExportPdf("Bank Payment", "BankPayment")}
          onPrint={() => onPrint("Bank Payment")}
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
      </ListingCard>
    </div>
  );
};

export default BankPaymentList;
