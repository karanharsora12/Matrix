import { MenuList, getListingColumns } from "@/lib/defaults";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingHeader } from "@/components/common/ListingHeader";
import { WEB_ROUTES } from "@/config/webRoutes";
import { TransactionType } from "@/constants/enums";
import { useGridActions } from "@/hooks/useGridActions";
import { buildRoute, encodeURL } from "@/lib/utils";
import type { ColDef } from "ag-grid-community";
import { formatDate } from "@/utils/date";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListingCard } from "@/components/common/ListingCard";
import { API_ENDPOINTS } from "@/config/apiEndpoints";

const CashPaymentList: React.FC = () => {
  const navigate = useNavigate();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();
  const [searchTerm, setSearchTerm] = useState("");

  const handleNavigate = (id?: number) => {
    const token = encodeURL({ id });
    navigate(buildRoute(WEB_ROUTES.TRANSACTION.CASH_PAYMENT, { token }));
  };

  const apiInput = useMemo(
    () => ({
      transactionType: TransactionType.CPAY,
      search: searchTerm.trim() || undefined,
    }),
    [searchTerm],
  );

  const columnDefs = useMemo<ColDef[]>(
    () =>
      getListingColumns(MenuList.CASH_PAYMENT, {
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

  return (
    <div className="p-3 h-full flex flex-col">
      <ListingCard>
        <ListingHeader
          title="Cash Payment"
          addText="Add Cash Payment"
          onAdd={() => handleNavigate(0)}
          searchProps={{
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            placeholder: "Search cash payment vouchers...",
          }}
          onRefresh={() => gridRef.current?.api.refreshInfiniteCache()}
          onExportExcel={() => onExportExcel("CashPayment")}
          onExportPdf={() => onExportPdf("Cash Payment", "CashPayment")}
          onPrint={() => onPrint("Cash Payment")}
        />

        <DataGrid
          ref={gridRef}
          apiName={API_ENDPOINTS.PAYMENTS.BASE}
          apiInput={apiInput}
          columnDefs={columnDefs}
          gridOptions={{
            onRowDoubleClicked: (e) => {
              if (e.node.rowPinned) return;
              handleNavigate(e.data.id);
            },
          }}
        />
      </ListingCard>
    </div>
  );
};

export default CashPaymentList;
