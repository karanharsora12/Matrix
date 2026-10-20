import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  useDeleteAccount,
  useAccountMasterData,
  type Account,
} from "@/api/accounts";
import { WEB_ROUTES } from "@/config/webRoutes";
import { FormFooter } from "@/components/common/FormFooter";
import { confirmAlert } from "@/components/common/AlertModal";
import {
  AlertCircle,
  AtSign,
  Building2,
  Layers,
  Mail,
  ShieldCheck,
  User,
  UserCheck,
  X,
} from "lucide-react";

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
  const accountId = id ? parseInt(id, 10) : undefined;

  const [formData, setFormData] = useState<Partial<Account>>({
    ...INITIAL_FORM,
  });
  const [error, setError] = useState<string>("");
  const [isAccountNameCustomized, setIsAccountNameCustomized] = useState(false);

  const { data: accountToEdit, isLoading: isFetchingAccount } = useAccount(
    isEditing ? accountId : undefined,
  );
  const { data: masterData } = useAccountMasterData();

  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();

  useEffect(() => {
    if (accountToEdit && isEditing) {
      setFormData(accountToEdit);
      setIsAccountNameCustomized(true);
    }
  }, [accountToEdit, isEditing]);

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  // Auto-compose accountName from names if user hasn't explicitly overridden it
  const handleNameChange = (
    field: "firstName" | "middleName" | "lastName",
    value: string,
  ) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (!isAccountNameCustomized && !isEditing) {
        const parts = [
          field === "firstName" ? value : prev.firstName,
          field === "middleName" ? value : prev.middleName,
          field === "lastName" ? value : prev.lastName,
        ].filter(Boolean);
        next.accountName = parts.join(" ");
      }
      return next;
    });
  };

  const handleSave = () => {
    setError("");

    if (!formData.accountTypeId) {
      setError("Please select an Account Type.");
      return;
    }
    if (!formData.accountGroupId) {
      setError("Please select an Account Group.");
      return;
    }
    if (!formData.accountName?.trim()) {
      setError("Please enter the Account Display Name.");
      return;
    }
    if (!formData.firstName?.trim()) {
      setError("Please enter First Name.");
      return;
    }
    if (!formData.lastName?.trim()) {
      setError("Please enter Last Name.");
      return;
    }
    if (!formData.userName?.trim()) {
      setError("Please enter a Username.");
      return;
    }
    if (!formData.email?.trim()) {
      setError("Please enter a valid Email address.");
      return;
    }

    if (isEditing && accountId) {
      updateMutation.mutate(
        { id: accountId, data: formData },
        {
          onSuccess: () => {
            navigate(WEB_ROUTES.MASTER.ACCOUNTS_MANAGEMENT.ACCOUNT_MASTER);
          },
          onError: (err: any) => {
            setError(
              err?.response?.data?.error ||
                err?.message ||
                "Failed to update account",
            );
          },
        },
      );
    } else {
      createMutation.mutate(formData as Omit<Account, "id">, {
        onSuccess: () => {
          navigate(WEB_ROUTES.MASTER.ACCOUNTS_MANAGEMENT.ACCOUNT_MASTER);
        },
        onError: (err: any) => {
          setError(
            err?.response?.data?.error ||
              err?.message ||
              "Failed to create account",
          );
        },
      });
    }
  };

  const handleDelete = async () => {
    if (!accountId) return;
    const isConfirmed = await confirmAlert({
      title: "Delete Account",
      description: `Are you sure you want to delete account "${formData.accountName || formData.userName}"? This action cannot be undone.`,
      confirmText: "Delete",
      variant: "danger",
    });

    if (isConfirmed) {
      deleteMutation.mutate(accountId, {
        onSuccess: () => {
          navigate(WEB_ROUTES.MASTER.ACCOUNTS_MANAGEMENT.ACCOUNT_MASTER);
        },
        onError: (err: any) => {
          setError(
            err?.response?.data?.error ||
              err?.message ||
              "Failed to delete account",
          );
        },
      });
    }
  };

  const handleClear = () => {
    setError("");
    setIsAccountNameCustomized(false);
    setFormData({ ...INITIAL_FORM });
  };

  if (isEditing && isFetchingAccount) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-2.5 text-sm text-slate-500 dark:text-zinc-400">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary-action border-t-transparent" />
        <span className="font-medium text-xs">Loading account details…</span>
      </div>
    );
  }

  const selectedAccountType = masterData?.accountTypes?.find(
    (t) => t.id === formData.accountTypeId,
  );
  const availableGroups = (masterData?.accountGroups || []).filter(
    (g) => g.accountTypeId === formData.accountTypeId,
  );

  return (
    <div className="min-h-full flex flex-col bg-slate-50/70 dark:bg-zinc-950">
      {/* ── Page Header Bar ── */}
      <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 px-5 py-3.5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-action/10 text-primary-action dark:bg-primary-action/20">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  {isEditing ? "Edit Account" : "New Account"}
                </h1>
                {isEditing && (
                  <Badge variant="outline" className="font-mono text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
                    #{id}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={
                    formData.isActive
                      ? "border-emerald-300 bg-emerald-50 text-[11px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "border-slate-200 bg-slate-100 text-[11px] font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                  }
                >
                  {formData.isActive ? "Active Account" : "Inactive Account"}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {isEditing
                  ? "Update customer, vendor, bank, or ledger account master record"
                  : "Register a customer, vendor, bank, or ledger account in the system"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Form Container ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl space-y-4 p-4 pb-28 sm:p-6">
          {/* Error Banner */}
          {error && (
            <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-800 shadow-sm dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span className="font-medium">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── CARD 1: Account Classification & Identification ── */}
          <section className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Layers className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                    Account Classification
                  </h2>
                </div>
              </div>
              {selectedAccountType && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {selectedAccountType.name}
                </span>
              )}
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Account Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Account Type <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={formData.accountTypeId ? String(formData.accountTypeId) : ""}
                    onValueChange={(val) =>
                      setFormData((cur) => ({
                        ...cur,
                        accountTypeId: parseInt(val, 10),
                        accountGroupId: undefined,
                      }))
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      {masterData?.accountTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()} className="text-xs">
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-slate-400">
                    Governs ledger behavior (e.g. Asset, Liability, Customer, Supplier)
                  </p>
                </div>

                {/* Account Group */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Account Group <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={formData.accountGroupId ? String(formData.accountGroupId) : ""}
                    onValueChange={(val) =>
                      setFormData((cur) => ({
                        ...cur,
                        accountGroupId: parseInt(val, 10),
                      }))
                    }
                    disabled={!formData.accountTypeId}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue
                        placeholder={
                          formData.accountTypeId
                            ? "Select account group"
                            : "Select Account Type first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()} className="text-xs">
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-slate-400">
                    Category group under the chosen account type
                  </p>
                </div>

                {/* Account Display Name (Full width) */}
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Account Display Name <span className="text-rose-500">*</span>
                    </Label>
                    {!isEditing && isAccountNameCustomized && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountNameCustomized(false);
                          const parts = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean);
                          setFormData((cur) => ({ ...cur, accountName: parts.join(" ") }));
                        }}
                        className="text-[11px] font-medium text-primary-action hover:underline"
                      >
                        Reset to Full Name
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      value={formData.accountName || ""}
                      onChange={(e) => {
                        setIsAccountNameCustomized(true);
                        setFormData({ ...formData, accountName: e.target.value });
                      }}
                      placeholder="e.g. Acme Corporation or John Doe"
                      className="pl-9 h-9 text-xs font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Official name displayed on invoices, receipts, bills, and account ledgers
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── CARD 2: Personal & Contact Information ── */}
          <section className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <User className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                    Personal & Contact Details
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* First Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    First Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={formData.firstName || ""}
                    onChange={(e) => handleNameChange("firstName", e.target.value)}
                    placeholder="e.g. John"
                    className="h-9 text-xs"
                  />
                </div>

                {/* Middle Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Middle Name <span className="text-[11px] font-normal text-slate-400">(Optional)</span>
                  </Label>
                  <Input
                    value={formData.middleName || ""}
                    onChange={(e) => handleNameChange("middleName", e.target.value)}
                    placeholder="e.g. M."
                    className="h-9 text-xs"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Last Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    value={formData.lastName || ""}
                    onChange={(e) => handleNameChange("lastName", e.target.value)}
                    placeholder="e.g. Doe"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── CARD 3: Identity & System Login Credentials ── */}
          <section className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                    System Identity & Credentials
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Username */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Username / Unique Handle <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      value={formData.userName || ""}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      placeholder="e.g. johndoe"
                      className="pl-9 h-9 text-xs font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Unique identification code or login handle
                  </p>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Email Address <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. john@example.com"
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Used for notifications, billing statements, and account statements
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ── Form Sticky Footer Actions ── */}
      <FormFooter
        onSave={handleSave}
        onClear={isEditing ? undefined : handleClear}
        onBack={() =>
          navigate(WEB_ROUTES.MASTER.ACCOUNTS_MANAGEMENT.ACCOUNT_MASTER)
        }
        onDelete={isEditing ? handleDelete : undefined}
        deleteText="Delete Account"
        isDeleting={deleteMutation.isPending}
        saveText={isEditing ? "Update Account" : "Save Account"}
        isSaveDisabled={isSaving}
        isSaving={isSaving}
        showIsActive={true}
        isActive={formData.isActive || false}
        isActiveLabel="Active Account"
        onIsActiveChange={(checked) =>
          setFormData({ ...formData, isActive: checked })
        }
      />
    </div>
  );
};

export default AccountForm;
