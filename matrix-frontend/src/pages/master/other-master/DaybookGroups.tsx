import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDaybookGroups,
  useCreateDaybookGroup,
  useUpdateDaybookGroup,
  useDeleteDaybookGroup,
  type DaybookGroup,
} from "@/api/daybooks";
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
import { Badge } from "@/components/ui/badge";
import type { ColDef } from "ag-grid-community";

export default function DaybookGroups() {
  const queryClient = useQueryClient();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DaybookGroup | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<DaybookGroup>>({
    groupName: "",
    shortName: "",
    description: "",
    isActive: true,
  });

  const { data: response, isLoading } = useDaybookGroups();
  const daybookGroups = response?.data || [];

  const createMutation = useCreateDaybookGroup();
  const updateMutation = useUpdateDaybookGroup();
  const deleteMutation = useDeleteDaybookGroup();

  const handleAdd = () => {
    resetForm();
    setEditingGroup(null);
    setIsModalOpen(true);
  };

  const handleEdit = (group: DaybookGroup) => {
    setEditingGroup(group);
    setFormData({
      groupName: group.groupName || "",
      shortName: group.shortName || "",
      description: group.description || "",
      isActive: group.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmAlert({
      title: "Delete Day Book Group",
      description:
        "Are you sure you want to delete this day book group? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });

    if (isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      groupName: "",
      shortName: "",
      description: "",
      isActive: true,
    });
  };

  const handleSave = () => {
    if (!formData.groupName || !formData.shortName) return;

    if (editingGroup) {
      updateMutation.mutate(
        { id: editingGroup.id, data: formData },
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
          groupName: formData.groupName!,
          shortName: formData.shortName!,
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
      { field: "id", headerName: "ID", width: 80, type: "numericColumn" },
      {
        field: "groupName",
        headerName: "Group Name",
        minWidth: 180,
      },
      {
        field: "shortName",
        headerName: "Short Name",
        minWidth: 120,
      },
      {
        field: "description",
        headerName: "Description",
        minWidth: 200,
        valueGetter: (params) => params.data?.description || "-",
      },
      {
        field: "isActive",
        headerName: "Status",
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
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return daybookGroups;
    const term = searchTerm.toLowerCase();
    return daybookGroups.filter(
      (group) =>
        group.groupName.toLowerCase().includes(term) ||
        group.shortName.toLowerCase().includes(term) ||
        (group.description && group.description.toLowerCase().includes(term)),
    );
  }, [daybookGroups, searchTerm]);

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <ListingHeader
        title="Day Book Groups"
        subtitle="Manage day book classification groups"
        onAdd={handleAdd}
        addText="Add Day Book Group"
        searchProps={{
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          placeholder: "Search day book groups...",
        }}
        onRefresh={() =>
          queryClient.invalidateQueries({ queryKey: ["daybookGroups"] })
        }
        onExportExcel={() => onExportExcel("Daybook_Groups")}
        onExportPdf={() =>
          onExportPdf("Day Book Groups List", "Daybook_Groups")
        }
        onPrint={() => onPrint("Day Book Groups List")}
      />

      {!isLoading && (
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
        title={editingGroup ? "Edit Day Book Group" : "Add Day Book Group"}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.groupName || !formData.shortName}
            >
              {editingGroup ? "Update Group" : "Save Group"}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-medium">
              Group Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="groupName"
              value={formData.groupName || ""}
              onChange={(e) =>
                setFormData({ ...formData, groupName: e.target.value })
              }
              placeholder="e.g. Sales"
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
              placeholder="e.g. SAL"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Input
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="e.g. Sales transactions"
              className="h-9"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive ?? true}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, isActive: !!e.target.checked })
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
