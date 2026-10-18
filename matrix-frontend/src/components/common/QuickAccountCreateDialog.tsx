import { useAccountMasterData, useCreateAccount, type Account } from "@/api/accounts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React, { useMemo, useState } from "react";

interface QuickAccountCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (account: Account) => void;
}

/** Compact reusable account creator for transaction screens. */
export const QuickAccountCreateDialog: React.FC<QuickAccountCreateDialogProps> = ({ open, onOpenChange, onCreated }) => {
  const { data: masterData } = useAccountMasterData();
  const createAccount = useCreateAccount();
  const [form, setForm] = useState({ firstName: "", middleName: "", lastName: "", mobile: "", email: "", accountTypeId: "", accountGroupId: "" });
  const [error, setError] = useState("");
  const groups = useMemo(() => (masterData?.accountGroups || []).filter((group) => String(group.accountTypeId) === form.accountTypeId), [masterData, form.accountTypeId]);
  const canSave = Boolean(form.firstName.trim() && form.mobile.trim() && form.accountTypeId && form.accountGroupId);

  const save = () => {
    if (!canSave) return;
    setError("");
    const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ");
    createAccount.mutate({ accountName: fullName, firstName: form.firstName, middleName: form.middleName || null, lastName: form.lastName || form.firstName, userName: form.mobile, email: form.email || `${form.mobile}@customer.local`, accountTypeId: Number(form.accountTypeId), accountGroupId: Number(form.accountGroupId), isActive: true }, {
      onSuccess: (account) => {
        onCreated(account);
        onOpenChange(false);
        setForm({ firstName: "", middleName: "", lastName: "", mobile: "", email: "", accountTypeId: "", accountGroupId: "" });
      },
      onError: (reason: any) => setError(reason?.response?.data?.error || "Unable to create customer account"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b shrink-0 sticky top-0 z-10 bg-background">
          <DialogTitle>New Customer Account</DialogTitle>
          <DialogDescription>
            Create a customer without leaving the transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 flex-1 overflow-y-auto min-h-0 space-y-4">
          {error && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label>First Name *</Label>
              <Input
                value={form.firstName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    firstName: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Middle Name</Label>
              <Input
                value={form.middleName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    middleName: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={form.lastName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    lastName: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Mobile / Code *</Label>
              <Input
                value={form.mobile}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    mobile: event.target.value,
                  }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Account Type *</Label>
              <Select
                value={form.accountTypeId}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    accountTypeId: value,
                    accountGroupId: "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {(masterData?.accountTypes || []).map((type) => (
                    <SelectItem key={type.id} value={String(type.id)}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Account Group *</Label>
              <Select
                value={form.accountGroupId}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    accountGroupId: value,
                  }))
                }
                disabled={!form.accountTypeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={String(group.id)}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 px-6 border-t bg-zinc-50/90 dark:bg-zinc-800/40 shrink-0 sticky bottom-0 z-10 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={!canSave || createAccount.isPending}
          >
            {createAccount.isPending ? "Creating…" : "Create Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAccountCreateDialog;
