import apiClient from "@/api/client";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingHeader } from "@/components/common/ListingHeader";
import { SideModal } from "@/components/common/SideModal";
import { confirmAlert } from "@/components/common/AlertModal";
import { useGridActions } from "@/hooks/useGridActions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import * as LucideIcons from "lucide-react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Download,
  Edit2,
  Eye,
  List,
  MoreHorizontal,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const iconOptions = [
  "LayoutDashboard",
  "TrendingUp",
  "ShoppingCart",
  "Package",
  "Users",
  "DollarSign",
  "Briefcase",
  "BarChart3",
  "Settings",
  "FileText",
  "CreditCard",
  "Truck",
  "Warehouse",
  "Receipt",
  "UserCog",
  "Calculator",
  "ClipboardList",
  "Building2",
  "Shield",
  "Bell",
  "Database",
  "Box",
  "Boxes",
  "Group",
  "Tags",
  "FolderTree",
  "Layers",
  "Barcode",
  "Tag",
];

interface MenuForm {
  id?: number;
  menuName: string;
  menuCaption: string;
  menuIcon: string;
  menuPath: string;
  parentMenuId: string;
  listRight: boolean;
  viewRight: boolean;
  addRight: boolean;
  editRight: boolean;
  showListingTotalRight: boolean;
  printRight: boolean;
  exportRight: boolean;
}

const emptyForm: MenuForm = {
  menuName: "",
  menuCaption: "",
  menuIcon: "Box",
  menuPath: "",
  parentMenuId: "",
  listRight: false,
  viewRight: false,
  addRight: false,
  editRight: false,
  showListingTotalRight: false,
  printRight: false,
  exportRight: false,
};

export default function MenuSetup() {
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();
  const [menus, setMenus] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<MenuForm>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);

  const fetchMenus = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.MENUS.BASE);
      setMenus(response.data);
    } catch (error) {
      console.error("Failed to fetch menus:", error);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const flatMenus = useMemo(() => {
    const flat: any[] = [];
    const walk = (items: any[], depth = 0) => {
      items.forEach((m) => {
        flat.push({ ...m, depth });
        if (m.children) walk(m.children, depth + 1);
      });
    };
    walk(menus);
    return flat;
  }, [menus]);

  const visibleRows = useMemo(() => {
    const rows: any[] = [];
    const searchLower = search.toLowerCase();
    const walk = (items: any[], depth: number) => {
      items.forEach((node) => {
        const matchSearch =
          !search ||
          node.menuCaption?.toLowerCase().includes(searchLower) ||
          node.menuName?.toLowerCase().includes(searchLower);

        let matchFilter = true;
        if (filter === "root") matchFilter = depth === 0;
        else if (filter === "parent")
          matchFilter = node.children && node.children.length > 0;
        else if (filter === "leaf")
          matchFilter = !node.children || node.children.length === 0;

        if ((matchSearch && matchFilter) || expanded[node.id]) {
          rows.push({ ...node, depth });
        }
        if (expanded[node.id] && node.children) {
          walk(node.children, depth + 1);
        }
      });
    };
    walk(menus, 0);
    return rows;
  }, [menus, expanded, search, filter]);

  const handleAdd = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleEdit = (menu: any) => {
    setForm({
      id: menu.id,
      menuName: menu.menuName || "",
      menuCaption: menu.menuCaption || "",
      menuIcon: menu.menuIcon || "Box",
      menuPath: menu.menuPath || "",
      parentMenuId: menu.parentMenuId ? String(menu.parentMenuId) : "",
      listRight: !!menu.listRight,
      viewRight: !!menu.viewRight,
      addRight: !!menu.addRight,
      editRight: !!menu.editRight,
      showListingTotalRight: !!menu.showListingTotalRight,
      printRight: !!menu.printRight,
      exportRight: !!menu.exportRight,
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmAlert({
      title: "Delete Menu",
      description:
        "Are you sure you want to delete this menu? This action cannot be undone and will remove all associated submenus.",
      confirmText: "Yes, delete",
      variant: "danger",
    });

    if (!isConfirmed) return;

    try {
      await apiClient.delete(API_ENDPOINTS.MENUS.BY_ID(id));
      fetchMenus();
    } catch {
      setMenus((prev) => {
        const remove = (items: any[]): any[] =>
          items
            .filter((m) => m.id !== id)
            .map((m) => ({
              ...m,
              children: m.children ? remove(m.children) : [],
            }));
        return remove(prev);
      });
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        parentMenuId: form.parentMenuId ? parseInt(form.parentMenuId) : null,
      };
      if (form.id) {
        await apiClient.put(API_ENDPOINTS.MENUS.BY_ID(form.id), payload);
      } else {
        await apiClient.post(API_ENDPOINTS.MENUS.BASE, payload);
      }
      setDialogOpen(false);
      fetchMenus();
    } catch (error) {
      console.error("Failed to save menu:", error);
      setDialogOpen(false);
    }
  };

  const set = (field: keyof MenuForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const parentMenus = useMemo(
    () => flatMenus.filter((m) => m.id !== form.id),
    [flatMenus, form.id],
  );

  const totalMenus = flatMenus.length;
  const topLevel = menus.length;
  const totalChildren = totalMenus - topLevel;

  const CaptionRenderer = (params: ICellRendererParams) => {
    const { data } = params;
    if (!data) return null;

    const isExpanded = expanded[data.id];
    const hasChildren = data.children && data.children.length > 0;
    const Icon =
      (LucideIcons as any)[data.menuIcon || "Box"] || LucideIcons.Box;

    return (
      <div
        className="flex items-center gap-2 h-full"
        style={{ paddingLeft: `${data.depth * 20}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => toggleExpand(data.id)}
            className="p-1 hover:bg-zinc-200 rounded dark:hover:bg-zinc-700 cursor-pointer flex items-center justify-center"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-6" /> // spacer
        )}
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800">
          <Icon className="h-3.5 w-3.5 text-zinc-500 shrink-0 dark:text-zinc-400" />
        </div>
        <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
          {data.menuCaption}
        </span>
      </div>
    );
  };

  const ActionsRenderer = (params: ICellRendererParams) => {
    if (!params.data) return null;
    return (
      <div className="flex items-center justify-end gap-2 h-full pr-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => handleEdit(params.data)}>
              <Edit2 className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(params.data.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const BooleanRenderer = (params: ICellRendererParams) => {
    return (
      <div className="flex items-center justify-center h-full">
        <Checkbox
          checked={!!params.value}
          disabled
          className="pointer-events-none"
        />
      </div>
    );
  };

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Caption",
        field: "menuCaption",
        cellRenderer: CaptionRenderer,
        minWidth: 280,
        flex: 2,
        rowDrag: true,
      },
      { headerName: "Name", field: "menuName", flex: 1, minWidth: 150 },
      { headerName: "Path", field: "menuPath", flex: 1, minWidth: 150 },
      {
        headerName: "List",
        field: "listRight",
        cellRenderer: BooleanRenderer,
        width: 80,
        flex: 0,
      },
      {
        headerName: "View",
        field: "viewRight",
        cellRenderer: BooleanRenderer,
        width: 80,
        flex: 0,
      },
      {
        headerName: "Add",
        field: "addRight",
        cellRenderer: BooleanRenderer,
        width: 80,
        flex: 0,
      },
      {
        headerName: "Edit",
        field: "editRight",
        cellRenderer: BooleanRenderer,
        width: 80,
        flex: 0,
      },
      {
        headerName: "Total",
        field: "showListingTotalRight",
        cellRenderer: BooleanRenderer,
        width: 80,
        flex: 0,
      },
      {
        headerName: "Print",
        field: "printRight",
        cellRenderer: BooleanRenderer,
        width: 80,
        flex: 0,
      },
      {
        headerName: "Export",
        field: "exportRight",
        cellRenderer: BooleanRenderer,
        width: 90,
        flex: 0,
      },
      {
        headerName: "Actions",
        cellRenderer: ActionsRenderer,
        width: 100,
        pinned: "right",
        flex: 0,
        sortable: false,
        filter: false,
      },
    ],
    [expanded],
  );

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <ListingHeader
        title="Menu Setup"
        onAdd={handleAdd}
        addText="Add Menu"
        searchProps={{
          value: search,
          onChange: (e) => setSearch(e.target.value),
          placeholder: "Search menus...",
        }}
        onRefresh={fetchMenus}
        onExportExcel={() => onExportExcel("Menu_Setup")}
        onExportPdf={() => onExportPdf("Menu Setup List", "Menu_Setup")}
        onPrint={() => onPrint("Menu Setup List")}
      />

      <DataGrid
        ref={gridRef}
        rowData={visibleRows}
        columnDefs={columnDefs}
        gridOptions={{
          rowHeight: 48,
          headerHeight: 48,
          pagination: false,
          rowDragManaged: true,
          animateRows: true,
          defaultColDef: {
            filter: false,
            floatingFilter: false,
          },
        }}
      />

      <SideModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={isEditing ? "Edit Menu" : "Add New Menu"}
        width="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.menuName || !form.menuCaption}
              className="gap-2"
            >
              {isEditing ? "Update Menu" : "Create Menu"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="menuName" className="text-sm font-medium">
              Menu Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="menuName"
              value={form.menuName}
              onChange={(e) => set("menuName", e.target.value)}
              placeholder="e.g. admin_setup"
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menuCaption" className="text-sm font-medium">
              Caption <span className="text-red-500">*</span>
            </Label>
            <Input
              id="menuCaption"
              value={form.menuCaption}
              onChange={(e) => set("menuCaption", e.target.value)}
              placeholder="e.g. Admin Setup"
              className="h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Icon</Label>
            <Select
              value={form.menuIcon}
              onValueChange={(v) => set("menuIcon", v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((icon) => {
                  const Ic = (LucideIcons as any)[icon];
                  return (
                    <SelectItem key={icon} value={icon}>
                      <div className="flex items-center gap-2">
                        {Ic && <Ic className="h-3.5 w-3.5" />}
                        <span>{icon}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="menuPath" className="text-sm font-medium">
              Path
            </Label>
            <Input
              id="menuPath"
              value={form.menuPath}
              onChange={(e) => set("menuPath", e.target.value)}
              placeholder="e.g. /admin-setup"
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Parent Menu</Label>
          <Select
            value={form.parentMenuId || "none"}
            onValueChange={(v) => set("parentMenuId", v === "none" ? "" : v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="None (Root level)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (Root level)</SelectItem>
              {parentMenus.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {"\u00A0\u00A0".repeat(m.depth)}
                  {m.menuCaption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Access Rights</h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "listRight" as const, label: "List", icon: List },
              { key: "viewRight" as const, label: "View", icon: Eye },
              { key: "addRight" as const, label: "Add", icon: Plus },
              { key: "editRight" as const, label: "Edit", icon: Edit2 },
              {
                key: "showListingTotalRight" as const,
                label: "Show Total",
                icon: ArrowUpRight,
              },
              { key: "printRight" as const, label: "Print", icon: Printer },
              {
                key: "exportRight" as const,
                label: "Export",
                icon: Download,
              },
            ].map(({ key, label, icon: Ic }) => (
              <label
                key={key}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all",
                  form[key]
                    ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30"
                    : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50",
                )}
              >
                <Checkbox
                  checked={form[key]}
                  onChange={(e) => set(key, e.target.checked)}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Ic className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </SideModal>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
