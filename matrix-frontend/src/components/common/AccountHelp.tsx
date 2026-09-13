import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import type { ColDef, ICellEditorParams } from "ag-grid-community";
import { ChevronDown, Search, UserPlus, X } from "lucide-react";
import {
  useAccountMasterData,
  useAccounts,
  type Account,
} from "@/api/accounts";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { WEB_ROUTES } from "@/config/webRoutes";
import { cn } from "@/lib/utils";
import { PopupTable } from "./PopupTable";

/**
 * Standard Account columns definition helper
 */
export const getAccountColumns = (
  groupMap: Record<number, string> = {},
  typeMap: Record<number, string> = {},
  overrides?: Partial<Record<string, Partial<ColDef>>>,
): ColDef[] => [
  {
    headerName: "Account Name",
    field: "accountName",
    minWidth: 200,
    flex: 1,
    valueGetter: (p) =>
      p.data?.accountName ||
      `${p.data?.firstName || ""} ${p.data?.lastName || ""}`.trim() ||
      "-",
    ...(overrides?.accountName || {}),
  },
  {
    headerName: "ID",
    field: "id",
    type: "numericColumn",
    width: 65,
    ...(overrides?.id || {}),
  },
  {
    headerName: "Short Name",
    field: "userName",
    width: 100,
    valueGetter: (p) =>
      p.data?.userName ||
      (p.data?.firstName ? p.data.firstName.slice(0, 4).toUpperCase() : "-"),
    ...(overrides?.userName || {}),
  },
  {
    headerName: "Group Name",
    field: "accountGroupId",
    valueGetter: (p) => groupMap[p.data?.accountGroupId] || "General",
    minWidth: 120,
    width: 130,
    ...(overrides?.accountGroupId || {}),
  },
  {
    headerName: "Mobile No.",
    field: "phone",
    valueGetter: (p) => p.data?.mobile || p.data?.phone || "-",
    minWidth: 120,
    width: 130,
    ...(overrides?.phone || {}),
  },
  {
    headerName: "Account Type",
    field: "accountTypeId",
    valueGetter: (p) => typeMap[p.data?.accountTypeId] || "-",
    minWidth: 140,
    width: 150,
    ...(overrides?.accountTypeId || {}),
  },
];

/**
 * Hook to get standard account columns with master data already mapped
 */
export const useAccountColumns = (
  overrides?: Partial<Record<string, Partial<ColDef>>>,
) => {
  const { data: masterData, isLoading } = useAccountMasterData();

  const groupMap = useMemo(() => {
    const map: Record<number, string> = {};
    masterData?.accountGroups?.forEach((g) => {
      map[g.id] = g.name;
    });
    return map;
  }, [masterData]);

  const typeMap = useMemo(() => {
    const map: Record<number, string> = {};
    masterData?.accountTypes?.forEach((t) => {
      map[t.id] = t.name;
    });
    return map;
  }, [masterData]);

  const columns = useMemo(
    () => getAccountColumns(groupMap, typeMap, overrides),
    [groupMap, typeMap, overrides],
  );

  return { columns, groupMap, typeMap, isLoading, masterData };
};

export interface AccountHelpProps {
  /** Display value for selected account name */
  accountName?: string;
  /** Value / ID of selected account (optional fallback) */
  value?: string | number;
  /** Placeholder text shown when no account is selected */
  placeholder?: string;
  /** Hover title for trigger button */
  title?: string;
  /** Disabled state */
  disabled?: boolean;

  /** Selection callback returning full Account entity */
  onSelect: (account: Account) => void;
  /** Clear callback if allowClear is true */
  onClear?: () => void;
  /** Quick add account button callback (defaults to navigating to Add Account page) */
  onAddAccount?: () => void;
  /** Whether to show the "+" / UserPlus button next to the search input */
  showAddButton?: boolean;
  /** Whether to show a clear button when an account is selected */
  allowClear?: boolean;

  /** Custom trigger element. If provided, replaces the default button trigger */
  trigger?: React.ReactNode;
  /** Controlled open state */
  open?: boolean;
  /** Controlled open change callback */
  onOpenChange?: (open: boolean) => void;

  /** Positioning placement for the popup */
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  /** Custom wrapper className */
  className?: string;
  /** Custom trigger className */
  triggerClassName?: string;
  /** Search placeholder inside popup */
  searchPlaceholder?: string;
  /** Width of popup table (default: 720) */
  width?: number;
  /** Height of popup table (default: 360) */
  height?: number;

  /** Custom column overrides */
  columnOverrides?: Partial<Record<string, Partial<ColDef>>>;
  /** Optional custom columns */
  columns?: ColDef[];
  /** Optional preloaded table data instead of fetching base accounts endpoint */
  tableData?: Account[];
  /** Filter function for account rows */
  filter?: (account: Account) => boolean;
  /** Filter by account type id or name */
  accountTypeFilter?: number | string | (number | string)[];
}

/**
 * Common Account Help Component
 * Can be used anywhere an account selection/search popup is needed.
 */
export const AccountHelp: React.FC<AccountHelpProps> = ({
  accountName,
  value,
  placeholder = "Select account (F2)",
  title,
  disabled = false,
  onSelect,
  onClear,
  onAddAccount,
  showAddButton = false,
  allowClear = false,
  trigger,
  open,
  onOpenChange,
  placement = "bottom-start",
  className,
  triggerClassName,
  searchPlaceholder = "Search accounts...",
  width = 720,
  height = 360,
  columnOverrides,
  columns: customColumns,
  tableData,
  filter,
  accountTypeFilter,
}) => {
  const navigate = useNavigate();
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { columns: defaultColumns, masterData } =
    useAccountColumns(columnOverrides);
  const columns = customColumns || defaultColumns;

  // Filter accounts if filter or accountTypeFilter is provided
  const { data: accountsResp } = useAccounts();
  const filteredTableData = useMemo(() => {
    if (tableData) {
      if (filter) return tableData.filter(filter);
      return tableData;
    }

    if (!filter && !accountTypeFilter) {
      return undefined; // Let PopupTable fetch via apiEndpoint
    }

    const list: Account[] = Array.isArray(accountsResp?.data)
      ? accountsResp.data
      : Array.isArray(accountsResp)
        ? (accountsResp as any)
        : [];

    return list.filter((acc) => {
      if (filter && !filter(acc)) return false;

      if (accountTypeFilter !== undefined) {
        const filters = Array.isArray(accountTypeFilter)
          ? accountTypeFilter
          : [accountTypeFilter];

        const matchId = filters.some((f) => Number(f) === acc.accountTypeId);
        if (matchId) return true;

        const typeName = masterData?.accountTypes
          ?.find((t) => t.id === acc.accountTypeId)
          ?.name?.toLowerCase();

        const matchName = filters.some(
          (f) => String(f).toLowerCase() === typeName,
        );
        if (!matchName) return false;
      }

      return true;
    });
  }, [tableData, filter, accountTypeFilter, accountsResp, masterData]);

  const handleAddClick = useCallback(() => {
    if (onAddAccount) {
      onAddAccount();
    } else {
      navigate(WEB_ROUTES.MASTER.ACCOUNTS_MANAGEMENT.ACCOUNT_MASTER_ADD);
    }
  }, [onAddAccount, navigate]);

  const accountDisplayName = accountName || (value ? String(value) : "");

  const defaultTrigger = (
    <button
      ref={triggerBtnRef}
      type="button"
      disabled={disabled}
      title={title || "Search Account (F2)"}
      className={cn(
        "flex flex-1 h-8 items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary-action dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
        triggerClassName,
      )}
    >
      <div className="flex items-center gap-2 truncate">
        <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span
          className={cn(
            "truncate font-medium",
            !accountDisplayName &&
              "text-slate-400 dark:text-zinc-500 font-normal",
          )}
        >
          {accountDisplayName || placeholder}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-1">
        {allowClear && accountDisplayName && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onClear?.();
            }}
            className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            title="Clear account"
          >
            <X className="h-3 w-3" />
          </span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </div>
    </button>
  );

  if (trigger) {
    return (
      <div
        ref={containerRef}
        className={cn("inline-flex items-center", className)}
      >
        <PopupTable
          open={open}
          onOpenChange={onOpenChange}
          placement={placement}
          apiEndpoint={
            filteredTableData ? undefined : API_ENDPOINTS.ACCOUNTS.BASE
          }
          tableData={filteredTableData}
          columns={columns}
          onSelect={onSelect}
          searchPlaceholder={searchPlaceholder}
          width={width}
          height={height}
          trigger={
            <div ref={triggerBtnRef as any} className="contents">
              {trigger}
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("flex items-center gap-1.5 w-full", className)}
    >
      <div className="flex-1 min-w-0 [&>div]:w-full [&>div]:flex">
        <PopupTable
          open={open}
          onOpenChange={onOpenChange}
          placement={placement}
          apiEndpoint={
            filteredTableData ? undefined : API_ENDPOINTS.ACCOUNTS.BASE
          }
          tableData={filteredTableData}
          columns={columns}
          onSelect={onSelect}
          searchPlaceholder={searchPlaceholder}
          width={width}
          height={height}
          trigger={defaultTrigger}
        />
      </div>

      {showAddButton && (
        <button
          type="button"
          onClick={handleAddClick}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-primary-action/10 hover:text-primary-action hover:border-primary-action/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 shrink-0 transition-colors"
          title="Add new account"
        >
          <UserPlus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export interface AccountCellEditorParams extends ICellEditorParams {
  onAccountSelect?: (account: Account, rowIndex: number) => void;
  filter?: (account: Account) => boolean;
  accountTypeFilter?: number | string | (number | string)[];
  searchPlaceholder?: string;
  width?: number;
  height?: number;
  columnOverrides?: Partial<Record<string, Partial<ColDef>>>;
}

/**
 * Common AG Grid Cell Editor for selecting accounts within table rows
 */
export const AccountCellEditor = forwardRef<any, AccountCellEditorParams>(
  (props, ref) => {
    const [open, setOpen] = useState(true);
    const selectedAccountRef = useRef<any>(props.value);
    const { columns } = useAccountColumns(props.columnOverrides);

    useImperativeHandle(ref, () => ({
      getValue() {
        return selectedAccountRef.current;
      },
      isCancelAfterEnd() {
        return false;
      },
    }));

    const handleSelect = (account: Account) => {
      selectedAccountRef.current = account.accountName || account.id;
      if (props.onAccountSelect) {
        props.onAccountSelect(account, props.rowIndex);
      }
      setOpen(false);
      props.stopEditing();
    };

    const handleOpenChange = (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) {
        props.stopEditing();
      }
    };

    return (
      <PopupTable
        open={open}
        onOpenChange={handleOpenChange}
        apiEndpoint={API_ENDPOINTS.ACCOUNTS.BASE}
        columns={columns}
        onSelect={handleSelect}
        searchPlaceholder={props.searchPlaceholder || "Search account..."}
        width={props.width || 720}
        height={props.height || 360}
      />
    );
  },
);

AccountCellEditor.displayName = "AccountCellEditor";

export default AccountHelp;
