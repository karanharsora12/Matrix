import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAccount,
  useCreateAccount,
  useUpdateAccount,
  useAccountMasterData,
} from "@/api/accounts";
import type { Account } from "@/api/accounts";
import { WEB_ROUTES } from "@/config/webRoutes";
import { FormFooter } from "@/components/common/FormFooter";

const INITIAL_FORM: Partial<Account> = {
  accountName: "",
  firstName: "",
  middleName: "",
  lastName: "",
  userName: "",
  email: "",
  accountTypeId: undefined,
  accountGroupId: undefined,
  isActive: true,
};

const AccountForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Partial<Account>>({
    ...INITIAL_FORM,
  });

  const { data: accountToEdit, isLoading: isFetchingAccount } = useAccount(
    isEditing ? parseInt(id!) : undefined,
  );
  const { data: masterData } = useAccountMasterData();

  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();

  useEffect(() => {
    if (accountToEdit && isEditing) {
      setFormData(accountToEdit);
    }
  }, [accountToEdit, isEditing]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

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

    if (isEditing) {
      updateMutation.mutate(
        { id: parseInt(id!), data: formData },
        {
          onSuccess: () => {
            navigate(WEB_ROUTES.MASTER.ACCOUNTS_MANAGEMENT.ACCOUNT_MASTER);
          },
          onError: (error: any) => {
            alert(error?.response?.data?.error || "Error updating account");
          },
        },
      );
    } else {
      createMutation.mutate(formData as Omit<Account, "id">, {
        onSuccess: () => {
          navigate(WEB_ROUTES.MASTER.ACCOUNTS_MANAGEMENT.ACCOUNT_MASTER);
        },
        onError: (error: any) => {
          alert(error?.response?.data?.error || "Error creating account");
        },
      });
    }
  };

  const handleClear = () => {
    setFormData({ ...INITIAL_FORM });
  };

  if (isEditing && isFetchingAccount) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        Loading account details...
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto">
        <div className="w-full pb-24">
          <div className="border-b border-gray-200 bg-white px-6 py-3">
            <h1 className="text-xl font-semibold text-gray-900">
              {isEditing ? "Edit Account" : "Add Account"}
            </h1>
          </div>

          <div className="px-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Account Name *</Label>
                <Input
                  value={formData.accountName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, accountName: e.target.value })
                  }
                  placeholder="e.g. Current Account"
                />
              </div>

              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={formData.firstName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="e.g. John"
                />
              </div>

              <div className="space-y-2">
                <Label>Middle Name</Label>
                <Input
                  value={formData.middleName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, middleName: e.target.value })
                  }
                  placeholder="e.g. M"
                />
              </div>

              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  value={formData.lastName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="e.g. Doe"
                />
              </div>

              <div className="space-y-2">
                <Label>Username *</Label>
                <Input
                  value={formData.userName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, userName: e.target.value })
                  }
                  placeholder="e.g. johndoe"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="e.g. john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label>Account Type *</Label>
                <Select
                  value={formData.accountTypeId?.toString() || ""}
                  onValueChange={(val) =>
                    setFormData({
                      ...formData,
                      accountTypeId: parseInt(val),
                      accountGroupId: undefined,
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
                <Label>Account Group *</Label>
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
                      ?.filter(
                        (g) => g.accountTypeId === formData.accountTypeId,
                      )
                      .map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FormFooter
        onSave={handleSave}
        onClear={handleClear}
        onBack={() =>
          navigate(WEB_ROUTES.MASTER.ACCOUNTS_MANAGEMENT.ACCOUNT_MASTER)
        }
        onPrint={() => {
          window.print();
        }}
        saveText="Save Account"
        isSaveDisabled={isSaving}
        showIsActive={true}
        isActive={formData.isActive || false}
        isActiveLabel="Active"
        onIsActiveChange={(checked) =>
          setFormData({ ...formData, isActive: checked })
        }
      />
    </div>
  );
};

export default AccountForm;
