import { DataGrid } from "@/components/common/DataGrid";
import { ListingCard } from "@/components/common/ListingCard";
import { ListingHeader } from "@/components/common/ListingHeader";
import { DatePicker } from "@/components/ui/date-picker";
import { WEB_ROUTES } from "@/config/webRoutes";
import { buildRoute, encodeURL } from "@/lib/utils";
import { formatDate } from "@/utils/date";
import { ADD_EDIT_COLUMNS } from "@/lib/defaults";
import type { ColDef } from "ag-grid-community";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const currency = (value: unknown) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });

const RepairingBillList: React.FC = () => {
  const navigate = useNavigate();
  const gridRef = useRef<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const openBill = useCallback(
    (id?: number) =>
      navigate(
        buildRoute(WEB_ROUTES.TRANSACTION.REPAIRING_BILL, {
          token: encodeURL({ id }),
        }),
      ),
    [navigate],
  );

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "voucherNo",
        headerName: "Bill No.",
        width: 110,
      },
      {
        field: "voucherDate",
        headerName: "Date",
        width: 100,
        valueFormatter: (p) => formatDate(p.value),
      },
      { field: "accountName", headerName: "Customer", width: 190 },
      { field: "customerPhone", headerName: "Mobile", width: 120 },
      {
        field: "receiptVoucherNo",
        headerName: "Receipt Ref",
        width: 120,
        valueFormatter: (p) =>
          p.node?.rowPinned ? "" : p.value ? `#${p.value}` : "Manual",
        cellClass: (p) =>
          p.value ? "font-semibold text-primary-action" : "text-slate-400 italic",
      },
      {
        field: "grandTotal",
        headerName: "Grand Total",
        width: 120,
        type: "numericColumn",
        valueFormatter: (p) => currency(p.value),
      },
      {
        field: "advanceAmount",
        headerName: "Adv. Adjusted",
        width: 120,
        type: "numericColumn",
        valueFormatter: (p) => currency(p.value),
      },
      {
        field: "settledAmount",
        headerName: "Settled",
        width: 110,
        type: "numericColumn",
        valueFormatter: (p) => currency(p.value),
      },
      {
        field: "balanceAmount",
        headerName: "Balance",
        width: 110,
        type: "numericColumn",
        valueFormatter: (p) => currency(p.value),
        cellClass: (p) =>
          Number(p.value || 0) > 0
            ? "font-semibold text-amber-600 dark:text-amber-400"
            : "font-semibold text-emerald-600 dark:text-emerald-400",
      },
      { field: "salesmanName", headerName: "Salesman", width: 130 },
      ...ADD_EDIT_COLUMNS,
    ],
    [],
  );

  const apiInput = useMemo(
    () => ({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      search: searchTerm.trim() || undefined,
    }),
    [fromDate, toDate, searchTerm],
  );

  return (
    <div className="flex h-full flex-col p-3">
      <ListingCard>
        <ListingHeader
          title="Repairing Bill"
          addText="Add Repairing Bill"
          onAdd={() => openBill(0)}
          searchProps={{
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            placeholder: "Search repairing bills...",
          }}
          onRefresh={() => gridRef.current?.api?.refreshInfiniteCache()}
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
          ref={gridRef}
          apiName="/sales"
          apiInput={apiInput}
          columnDefs={columnDefs}
          gridOptions={{
            onRowDoubleClicked: (event) => openBill(event.data.id),
          }}
        />
      </ListingCard>
    </div>
  );
};

export default RepairingBillList;
