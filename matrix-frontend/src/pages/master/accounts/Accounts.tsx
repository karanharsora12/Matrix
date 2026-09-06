import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ListingHeader } from "@/components/common/ListingHeader";
import { DataGrid } from "@/components/common/DataGrid";
import { GridDeleteCell } from "@/components/common/GridDeleteCell";
import { useGridActions } from "@/hooks/useGridActions";
import { confirmAlert } from "@/components/common/AlertModal";
import { useDeleteAccount, useAccountMasterData } from "@/api/accounts";
import type { Account } from "@/api/accounts";
import type { ColDef } from "ag-grid-community";
import { WEB_ROUTES } from "@/config/webRoutes";
import { API_ENDPOINTS } from "@/config/apiEndpoints";

const Accounts: React.FC = () => {
  const navigate = useNavigate();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: masterData } = useAccountMasterData();
  const deleteMutation = useDeleteAccount();

  const handleAdd = () => {
    navigate(WEB_ROUTES.MASTER.ACCOUNTS_MANAGEMENT.ACCOUNT_MASTER_ADD);
  };

  const handleEdit = (account: Account) => {
    navigate(
      WEB_ROUTES.MASTER.ACCOUNTS_MANAGEMENT.ACCOUNT_MASTER_EDIT.replace(
        ":id",
        account.id.toString(),
      ),
    );
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmAlert({
      title: "Confirm Delete",
      description:
        "Are you sure you want to delete this account? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });

    if (isConfirmed) {
      deleteMutation.mutate(id, {
        onSuccess: () => gridRef.current?.api.refreshInfiniteCache(),
      });
    }
  };

  const columnDefs = useMemo<ColDef[]>(() => {
    return [
      {
        field: "id",
        headerName: "ID",
        width: 80,
        type: "numericColumn",
      },
      { field: "accountName", headerName: "Account Name", width: 150 },
      { field: "userName", headerName: "Username", width: 120 },
      { field: "email", headerName: "Email", width: 200 },
      {
        headerName: "First Name",
        field: "firstName",
        width: 120,
      },
      { field: "middleName", headerName: "Middle Name", width: 120 },
      { field: "lastName", headerName: "Last Name", width: 120 },
      {
        headerName: "Type",
        valueGetter: (params) => {
          if (params.node?.rowPinned) return "";
          return (
            masterData?.accountTypes?.find(
              (t) => t.id === params.data?.accountTypeId,
            )?.name || ""
          );
        },
        width: 100,
      },
      {
        headerName: "Group",
        valueGetter: (params) => {
          if (params.node?.rowPinned) return "";
          return (
            masterData?.accountGroups?.find(
              (g) => g.id === params.data?.accountGroupId,
            )?.name || ""
          );
        },
        width: 120,
      },
      {
        field: "isActive",
        headerName: "Active",
        width: 70,
      },
      {
        headerName: "",
        width: 60,
        pinned: "right",
        cellRenderer: (params: any) => {
          if (params.node?.rowPinned) return null;
          return <GridDeleteCell {...params} />;
        },
        cellRendererParams: {
          onDelete: handleDelete,
        },
      },
    ];
  }, [masterData]);

  const accountApiInput = useMemo(() => ({ search: searchTerm }), [searchTerm]);

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <ListingHeader
        title="Accounts"
        subtitle="Manage financial accounts, types and groups"
        onAdd={handleAdd}
        addText="Add Account"
        searchProps={{
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          placeholder: "Search accounts...",
        }}
        onRefresh={() => gridRef.current?.api.refreshInfiniteCache()}
        onExportExcel={() => onExportExcel("Accounts")}
        onExportPdf={() => onExportPdf("Accounts List", "Accounts")}
        onPrint={() => onPrint("Accounts List")}
      />

      <DataGrid
        ref={gridRef}
        apiName={API_ENDPOINTS.ACCOUNTS.BASE}
        apiInput={accountApiInput}
        columnDefs={columnDefs}
        gridOptions={{
          onRowDoubleClicked: (e) => {
            if (e.node.rowPinned) return;
            handleEdit(e.data);
          },
        }}
      />
    </div>
  );
};

export default Accounts;
