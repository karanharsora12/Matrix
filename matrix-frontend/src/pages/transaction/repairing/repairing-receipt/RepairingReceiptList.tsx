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
  const { refetch, isLoading, isError, error } = useOrders({
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
        minWidth: 130,
        pinned: "left",
      },
      {
        field: "voucherDate",
        headerName: "Date",
        width: 110,
        valueFormatter: (p) => formatDate(p.value),
      },
      { field: "accountName", headerName: "Customer", minWidth: 190 },
      { field: "customerPhone", headerName: "Mobile", width: 130 },
      {
        field: "itemCount",
        headerName: "Items",
        width: 80,
        type: "numericColumn",
      },
      {
        field: "grandTotal",
        headerName: "Total",
        width: 130,
        type: "numericColumn",
        valueFormatter: (p) => currency(p.value),
      },
      {
        field: "receivedAmount",
        headerName: "Received",
        width: 130,
        type: "numericColumn",
        valueFormatter: (p) => currency(p.value),
      },
      {
        field: "balanceAmount",
        headerName: "Balance",
        width: 130,
        type: "numericColumn",
        valueFormatter: (p) => currency(p.value),
      },
      { field: "salesmanName", headerName: "Technician", minWidth: 140 },
    ],
    [openReceipt],
  );

  return (
    <div className="flex h-full flex-col p-3">
      <ListingCard>
        <ListingHeader
          title="Repairing Receipt"
          subtitle="Repair orders with linked cash and bank collections"
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
        {isError ? (
          <div className="flex flex-1 items-center justify-center text-sm text-red-600">
            Unable to load repairing receipts:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        ) : isLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-zinc-500">
            Loading repairing receipts…
          </div>
        ) : (
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
        )}
      </ListingCard>
    </div>
  );
};

export default RepairingReceiptList;
