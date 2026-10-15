import { useAccounts } from "@/api/accounts";
import { deleteOrder, useOrders } from "@/api/orders";
import { DataGrid } from "@/components/common/DataGrid";
import { confirmAlert } from "@/components/common/AlertModal";
import { ListingCard } from "@/components/common/ListingCard";
import { ListingHeader } from "@/components/common/ListingHeader";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WEB_ROUTES } from "@/config/webRoutes";
import { formatDate } from "@/utils/date";
import { buildRoute, encodeURL } from "@/lib/utils";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Pencil, Trash2 } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [accountId, setAccountId] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageSize, setPageSize] = useState("50");
  const { data: accountsResponse } = useAccounts();
  const { refetch, isLoading, isError, error } = useOrders({
    search,
    accountId: accountId === "all" ? undefined : Number(accountId),
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

  const removeReceipt = useCallback(
    async (id: number, voucherNo: string) => {
      const confirmed = await confirmAlert({
        title: "Delete Repairing Receipt?",
        description: `Receipt ${voucherNo} and its linked cash/bank vouchers will be deleted.`,
        confirmText: "Delete",
        variant: "danger",
      });
      if (!confirmed) return;
      await deleteOrder(id);
      refetch();
    },
    [refetch],
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
      {
        headerName: "Actions",
        width: 120,
        pinned: "right",
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams) => (
          <div className="flex h-full items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-600"
              title="Delete"
              onClick={() =>
                removeReceipt(params.data.id, params.data.voucherNo)
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [openReceipt, removeReceipt],
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
          searchProps={{
            value: search,
            onChange: (event) => setSearch(event.target.value),
            placeholder: "Receipt no. or customer...",
          }}
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
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All customers</SelectItem>
                  {(accountsResponse?.data || [])
                    .filter((account) => account.isActive)
                    .map((account) => (
                      <SelectItem key={account.id} value={String(account.id)}>
                        {account.accountName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={pageSize} onValueChange={setPageSize}>
                <SelectTrigger className="h-8 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[25, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}/page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              search,
              accountId: accountId === "all" ? undefined : Number(accountId),
              fromDate: fromDate || undefined,
              toDate: toDate || undefined,
            }}
            infiniteScroll
            pageSize={Number(pageSize)}
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
