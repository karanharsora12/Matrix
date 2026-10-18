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

const BankReceiptList: React.FC = () => {
  const navigate = useNavigate();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();
  const [searchTerm, setSearchTerm] = useState("");

  const handleNavigate = (id?: number) => {
    const token = encodeURL({ id });
    navigate(buildRoute(WEB_ROUTES.TRANSACTION.BANK_RECEIPT, { token }));
  };

  const apiInput = useMemo(
    () => ({
      transactionType: TransactionType.BREC,
      search: searchTerm.trim() || undefined,
    }),
    [searchTerm],
  );

  const columnDefs = useMemo<ColDef[]>(
    () =>
      getListingColumns(MenuList.BANK_RECEIPT, {
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
          title="Bank Receipt"
          addText="Add Bank Receipt"
          onAdd={() => handleNavigate(0)}
          searchProps={{
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            placeholder: "Search bank receipt vouchers...",
          }}
          onRefresh={() => gridRef.current?.api.refreshInfiniteCache()}
          onExportExcel={() => onExportExcel("BankReceipt")}
          onExportPdf={() => onExportPdf("Bank Receipt", "BankReceipt")}
          onPrint={() => onPrint("Bank Receipt")}
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

export default BankReceiptList;
