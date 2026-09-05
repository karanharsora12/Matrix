import {
  useCreateDaybook,
  useDaybookGroups,
  useDaybooks,
  useDeleteDaybook,
  useUpdateDaybook,
  type Daybook,
} from "@/api/daybooks";
import { confirmAlert } from "@/components/common/AlertModal";
import { DataGrid } from "@/components/common/DataGrid";
import { GridDeleteCell } from "@/components/common/GridDeleteCell";
import { ListingHeader } from "@/components/common/ListingHeader";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGridActions } from "@/hooks/useGridActions";
import { useQueryClient } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import { useMemo, useState } from "react";

export default function Daybooks() {
  const queryClient = useQueryClient();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDaybook, setEditingDaybook] = useState<Daybook | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Daybook>>({
    daybookName: "",
    shortName: "",
    daybookGroupId: undefined,
    voucherPrefix: "",
    allowManualNumber: false,
    description: "",
    isActive: true,
  });

  const { data: daybooksResp, isLoading: isDaybooksLoading } = useDaybooks();
  const { data: groupsResp } = useDaybookGroups();

  const daybooks = daybooksResp?.data || [];
  const daybookGroups = groupsResp?.data || [];

  const createMutation = useCreateDaybook();
  const updateMutation = useUpdateDaybook();
  const deleteMutation = useDeleteDaybook();

  const handleAdd = () => {
    resetForm();
    setEditingDaybook(null);
    setIsModalOpen(true);
  };

  const handleEdit = (daybook: Daybook) => {
    setEditingDaybook(daybook);
    setFormData({
      daybookName: daybook.daybookName || "",
      shortName: daybook.shortName || "",
      daybookGroupId: daybook.daybookGroupId,
      voucherPrefix: daybook.voucherPrefix || "",
      allowManualNumber: daybook.allowManualNumber ?? false,
      description: daybook.description || "",
      isActive: daybook.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmAlert({
      title: "Delete Daybook",
      description:
        "Are you sure you want to delete this daybook? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });

    if (isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      daybookName: "",
      shortName: "",
      daybookGroupId: undefined,
      voucherPrefix: "",
      allowManualNumber: false,
      description: "",
      isActive: true,
    });
  };

  const handleSave = () => {
    if (
      !formData.daybookName ||
      !formData.shortName ||
      !formData.daybookGroupId ||
      !formData.voucherPrefix
    )
      return;

    if (editingDaybook) {
      updateMutation.mutate(
        { id: editingDaybook.id, data: formData },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            resetForm();
          },
        },
      );
    } else {
      createMutation.mutate(
        {
          daybookName: formData.daybookName!,
          shortName: formData.shortName!,
          daybookGroupId: formData.daybookGroupId!,
          voucherPrefix: formData.voucherPrefix!,
          allowManualNumber: formData.allowManualNumber ?? false,
          description: formData.description || "",
          isActive: formData.isActive ?? true,
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            resetForm();
          },
        },
      );
    }
  };

  const columnDefs = useMemo<ColDef[]>(() => {
    return [
      { field: "id", headerName: "ID", width: 70, type: "numericColumn" },
      {
        field: "daybookName",
        headerName: "Daybook Name",
        minWidth: 160,
      },
      {
        field: "shortName",
        headerName: "Short Name",
        width: 110,
      },
      {
        field: "daybookGroupId",
        headerName: "Group",
        minWidth: 140,
        valueGetter: (params) => {
          if (params.node?.rowPinned) return "";
          const grp = daybookGroups.find(
            (g) => g.id === params.data?.daybookGroupId,
          );
          return grp ? grp.groupName : params.data?.daybookGroupId;
        },
      },
      {
        field: "voucherPrefix",
        headerName: "Prefix",
        width: 100,
      },
      {
        field: "allowManualNumber",
        headerName: "Manual No.",
        width: 120,
        cellRenderer: (params: any) => {
          if (params.node?.rowPinned) return null;
          return params.value ? "Yes" : "No";
        },
      },
      {
        field: "description",
        headerName: "Description",
        minWidth: 160,
        valueGetter: (params) => params.data?.description || "-",
      },
      {
        field: "isActive",
        headerName: "Active",
        width: 70,
      },
      {
        headerName: "",
        width: 60,
        cellRenderer: (params: any) => {
          if (params.node?.rowPinned) return null;
          return <GridDeleteCell {...params} />;
        },
        cellRendererParams: {
          onDelete: handleDelete,
        },
      },
    ];
  }, [daybookGroups]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return daybooks;
    const term = searchTerm.toLowerCase();
    return daybooks.filter(
      (dbk) =>
        dbk.daybookName.toLowerCase().includes(term) ||
        dbk.shortName.toLowerCase().includes(term) ||
        dbk.voucherPrefix.toLowerCase().includes(term) ||
        (dbk.description && dbk.description.toLowerCase().includes(term)),
    );
  }, [daybooks, searchTerm]);

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <ListingHeader
        title="Daybooks"
        subtitle="Manage financial daybook registers"
        onAdd={handleAdd}
        addText="Add Daybook"
        searchProps={{
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          placeholder: "Search daybooks...",
        }}
        onRefresh={() =>
          queryClient.invalidateQueries({ queryKey: ["daybooks"] })
        }
        onExportExcel={() => onExportExcel("Daybooks")}
        onExportPdf={() => onExportPdf("Daybooks List", "Daybooks")}
        onPrint={() => onPrint("Daybooks List")}
      />

      {!isDaybooksLoading && (
        <DataGrid
          ref={gridRef}
          rowData={filteredData}
          columnDefs={columnDefs}
          gridOptions={{
            onRowDoubleClicked: (e) => {
              if (e.node.rowPinned) return;
              handleEdit(e.data);
            },
            pagination: false,
          }}
        />
      )}

      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingDaybook ? "Edit Daybook" : "Add Daybook"}
        width="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !formData.daybookName ||
                !formData.shortName ||
                !formData.daybookGroupId ||
                !formData.voucherPrefix
              }
            >
              {editingDaybook ? "Update Daybook" : "Save Daybook"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="daybookName" className="text-sm font-medium">
              Daybook Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="daybookName"
              value={formData.daybookName || ""}
              onChange={(e) =>
                setFormData({ ...formData, daybookName: e.target.value })
              }
              placeholder="e.g. Wholesale Sales"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortName" className="text-sm font-medium">
              Short Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="shortName"
              value={formData.shortName || ""}
              onChange={(e) =>
                setFormData({ ...formData, shortName: e.target.value })
              }
              placeholder="e.g. WSAL"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Day Book Group <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.daybookGroupId?.toString() || ""}
              onValueChange={(val) =>
                setFormData({ ...formData, daybookGroupId: parseInt(val) })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select Group" />
              </SelectTrigger>
              <SelectContent>
                {daybookGroups.map((g) => (
                  <SelectItem key={g.id} value={g.id.toString()}>
                    {g.groupName} ({g.shortName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="voucherPrefix" className="text-sm font-medium">
              Voucher Prefix <span className="text-red-500">*</span>
            </Label>
            <Input
              id="voucherPrefix"
              value={formData.voucherPrefix || ""}
              onChange={(e) =>
                setFormData({ ...formData, voucherPrefix: e.target.value })
              }
              placeholder="e.g. INV"
              className="h-9"
            />
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Input
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="e.g. Wholesale steel sales"
              className="h-9"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="allowManualNumber"
              checked={formData.allowManualNumber ?? false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  allowManualNumber: !!e.target?.checked,
                })
              }
            />
            <Label
              htmlFor="allowManualNumber"
              className="text-sm font-medium cursor-pointer"
            >
              Allow Manual Numbering
            </Label>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="isActive"
              checked={formData.isActive ?? true}
              onChange={(e) =>
                setFormData({ ...formData, isActive: !!e.target.value })
              }
            />
            <Label
              htmlFor="isActive"
              className="text-sm font-medium cursor-pointer"
            >
              Is Active
            </Label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
