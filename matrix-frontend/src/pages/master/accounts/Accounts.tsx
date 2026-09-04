import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ListingHeader } from "@/components/common/ListingHeader";
import { DataGrid } from "@/components/common/DataGrid";
import { GridDeleteCell } from "@/components/common/GridDeleteCell";
import { useGridActions } from "@/hooks/useGridActions";
import { Modal } from "@/components/common/Modal";
import { confirmAlert } from "@/components/common/AlertModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useAccountMasterData,
  Account,
} from "@/api/accounts";
import type { ColDef } from "ag-grid-community";

const Accounts: React.FC = () => {
  const queryClient = useQueryClient();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [formData, setFormData] = useState<Partial<Account>>({
    accountName: "",
    firstName: "",
    middleName: "",
    lastName: "",
    userName: "",
    email: "",
    accountTypeId: undefined,
    accountGroupId: undefined,
    isActive: true,
  });

  const { data: accounts = [], isLoading } = useAccounts();
  const { data: masterData } = useAccountMasterData();
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();

  const handleAdd = () => {
    resetForm();
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData(account);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmAlert({
      title: "Confirm Delete",
      description: "Are you sure you want to delete this account? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });

    if (isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      accountName: "",
      firstName: "",
      middleName: "",
      lastName: "",
      userName: "",
      email: "",
      accountTypeId: undefined,
      accountGroupId: undefined,
      isActive: true,
    });
  };

  const handleSave = () => {
    if (
      !formData.accountName ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.userName ||
      !formData.email ||
      !formData.accountTypeId ||
      !formData.accountGroupId
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    if (editingAccount) {
      updateMutation.mutate(
        { id: editingAccount.id, data: formData },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            resetForm();
          },
          onError: (error: any) => {
            alert(error?.response?.data?.error || "Error updating account");
          }
        },
      );
    } else {
      createMutation.mutate(formData as Omit<Account, "id">, {
        onSuccess: () => {
          setIsModalOpen(false);
          resetForm();
        },
        onError: (error: any) => {
          alert(error?.response?.data?.error || "Error creating account");
        }
      });
    }
  };

  const columnDefs = useMemo<ColDef[]>(() => {
    return [
      { field: "id", headerName: "ID", width: 80 },
      { field: "accountName", headerName: "Account Name", flex: 1 },
      { field: "userName", headerName: "Username", flex: 1 },
      { field: "email", headerName: "Email", flex: 1 },
      {
        headerName: "Type",
        valueGetter: (params) => {
          return masterData?.accountTypes?.find((t) => t.id === params.data.accountTypeId)?.name || "";
        },
      },
      {
        headerName: "Group",
        valueGetter: (params) => {
          return masterData?.accountGroups?.find((g) => g.id === params.data.accountGroupId)?.name || "";
        },
      },
      {
        field: "isActive",
        headerName: "Active",
        width: 100,
      },
      {
        headerName: "",
        width: 60,
        cellRenderer: GridDeleteCell,
        cellRendererParams: {
          onDelete: handleDelete,
        },
      },
    ];
  }, [masterData]);

  const filteredData = accounts.filter((account) =>
    account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["accounts"] })}
        onExportExcel={() => onExportExcel("Accounts")}
        onExportPdf={() => onExportPdf("Accounts List", "Accounts")}
        onPrint={() => onPrint("Accounts List")}
      />

      {!isLoading && (
        <DataGrid
          ref={gridRef}
          rowData={filteredData}
          columnDefs={columnDefs}
          gridOptions={{
            onRowDoubleClicked: (e) => handleEdit(e.data),
            pagination: false,
          }}
        />
      )}

      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingAccount ? "Edit Account" : "Add Account"}
        width="lg"
        footer={
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked === true })
                }
              />
              <Label
                htmlFor="isActive"
                className="cursor-pointer font-normal text-sm"
              >
                Is Active
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Save
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="accountName">Account Name <span className="text-red-500">*</span></Label>
            <Input
              id="accountName"
              value={formData.accountName || ""}
              onChange={(e) =>
                setFormData({ ...formData, accountName: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
            <Input
              id="firstName"
              value={formData.firstName || ""}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              value={formData.middleName || ""}
              onChange={(e) =>
                setFormData({ ...formData, middleName: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
            <Input
              id="lastName"
              value={formData.lastName || ""}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userName">Username <span className="text-red-500">*</span></Label>
            <Input
              id="userName"
              value={formData.userName || ""}
              onChange={(e) =>
                setFormData({ ...formData, userName: e.target.value })
              }
            />
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Account Type <span className="text-red-500">*</span></Label>
            <Select
              value={formData.accountTypeId?.toString() || ""}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  accountTypeId: parseInt(val),
                  accountGroupId: undefined // Reset group when type changes
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {masterData?.accountTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Account Group <span className="text-red-500">*</span></Label>
            <Select
              value={formData.accountGroupId?.toString() || ""}
              onValueChange={(val) =>
                setFormData({ ...formData, accountGroupId: parseInt(val) })
              }
              disabled={!formData.accountTypeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {masterData?.accountGroups
                  ?.filter((g) => g.accountTypeId === formData.accountTypeId)
                  .map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Accounts;
