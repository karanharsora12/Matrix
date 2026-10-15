import { useAccounts } from "@/api/accounts";
import { useOrders } from "@/api/orders";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingCard } from "@/components/common/ListingCard";
import { ListingHeader } from "@/components/common/ListingHeader";
import { DatePicker } from "@/components/ui/date-picker";
import { WEB_ROUTES } from "@/config/webRoutes";
import { buildRoute, encodeURL } from "@/lib/utils";
import { formatDate } from "@/utils/date";
import type { ColDef } from "ag-grid-community";
import React, { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const currency = (value: unknown) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });

const RepairingReceiptList: React.FC = () => {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { refetch } = useOrders({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  const openReceipt = useCallback(
    (id?: number) =>
      navigate(
        buildRoute(WEB_ROUTES.TRANSACTION.REPAIRING_RECEIPT, {
          token: encodeURL({ id }),
        }),
      ),
    [navigate],
  );

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "voucherNo",
        headerName: "Receipt No.",
        width: 100,
      },
      {
        field: "voucherDate",
        headerName: "Date",
        width: 100,
        valueFormatter: (p) => formatDate(p.value),
      },
      { field: "accountName", headerName: "Customer", width: 190 },
      { field: "customerPhone", headerName: "Mobile", width: 130 },
      {
        field: "grandTotal",
        headerName: "Total",
        width: 120,
        type: "numericColumn",
        valueFormatter: (p) => currency(p.value),
      },
      {
        field: "receivedAmount",
        headerName: "Received",
        width: 120,
        type: "numericColumn",
        valueFormatter: (p) => currency(p.value),
      },
      {
        field: "balanceAmount",
        headerName: "Balance",
        width: 120,
        type: "numericColumn",
        valueFormatter: (p) => currency(p.value),
      },
      { field: "salesmanName", headerName: "Salesman", width: 140 },
    ],
    [openReceipt],
  );

  return (
    <div className="flex h-full flex-col p-3">
      <ListingCard>
        <ListingHeader
          title="Repairing Receipt"
          addText="Add Repairing Receipt"
          onAdd={() => openReceipt(0)}
          onRefresh={() => refetch()}
          extraButtons={
            <>
              <DatePicker
                value={fromDate}
                onChange={setFromDate}
                placeholder="From date"
                className="w-32"
              />
              <DatePicker
                value={toDate}
                onChange={setToDate}
                placeholder="To date"
                className="w-32"
              />
            </>
          }
        />

        <DataGrid
          apiName="/orders"
          apiInput={{
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
          }}
          infiniteScroll
          columnDefs={columnDefs}
          gridOptions={{
            onRowDoubleClicked: (event) => openReceipt(event.data.id),
          }}
        />
      </ListingCard>
    </div>
  );
};

export default RepairingReceiptList;
