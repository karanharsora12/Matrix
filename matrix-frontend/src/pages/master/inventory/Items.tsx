import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
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
  useItems,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
} from "@/api/inventory";
import { CommonListType } from "@/constants/enums";
import type { ColDef } from "ag-grid-community";
import type { Item } from "@/api/inventory";
import { MultiSelect } from "@/components/ui/multi-select";

const Items: React.FC = () => {
  const queryClient = useQueryClient();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Item>>({
    itemName: "",
    shortName: "",
    isActive: true,
    attributes: [],
  });

  const { data: items = [], isLoading } = useItems();
  const { commonLists } = useSelector((state: RootState) => state.inventory);
  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();
  const deleteMutation = useDeleteItem();

  const attributeTypes = useMemo(() => {
    return commonLists.filter((cl) => cl.listType === CommonListType.ATTRIBUTE);
  }, [commonLists]);

  const handleAdd = () => {
    resetForm();
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({ ...item, attributes: item.attributes || [] });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmAlert({
      title: "Confirm Delete",
      description:
        "Are you sure you want to delete this item? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });

    if (isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      itemName: "",
      shortName: "",
      isActive: true,
      attributes: [],
    });
  };

  const handleSave = () => {
    if (!formData.itemName?.trim() || !formData.shortName?.trim()) {
      return;
    }

    if (editingItem) {
      updateMutation.mutate(
        { id: editingItem.id, data: formData },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            resetForm();
          },
        },
      );
    } else {
      createMutation.mutate(formData as Omit<Item, "id">, {
        onSuccess: () => {
          setIsModalOpen(false);
          resetForm();
        },
      });
    }
  };

  const columnDefs = useMemo<ColDef[]>(() => {
    return [
      { field: "id", headerName: "ID", width: 60 },
      { field: "itemName", headerName: "Item Name", width: 200 },
      { field: "shortName", headerName: "Short Name", width: 120 },
      {
        field: "isActive",
        headerName: "Active",
        width: 80,
      },
      {
        headerName: "Attributes",
        valueGetter: (params) => {
          const itemAttrs = params.data.attributes || [];
          return itemAttrs
            .map((attrId: number) => {
              const attr = commonLists.find((a) => a.id === attrId);
              return attr ? attr.listValue : "";
            })
            .filter(Boolean)
            .join(", ");
        },
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
  }, [commonLists]);

  const filteredData = items.filter((item) =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <ListingHeader
        title="Items"
        subtitle="Manage your items and attributes"
        onAdd={handleAdd}
        addText="Add Item"
        searchProps={{
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          placeholder: "Search items...",
        }}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["items"] })}
        onExportExcel={() => onExportExcel("Items")}
        onExportPdf={() => onExportPdf("Items List", "Items")}
        onPrint={() => onPrint("Items List")}
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
        title={editingItem ? "Edit Item" : "Add Item"}
        width="lg"
        footer={
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
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
          <div className="space-y-2">
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              value={formData.itemName || ""}
              onChange={(e) =>
                setFormData({ ...formData, itemName: e.target.value })
              }
              placeholder="e.g. Steel Pipe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shortName">Short Name</Label>
            <Input
              id="shortName"
              value={formData.shortName || ""}
              onChange={(e) =>
                setFormData({ ...formData, shortName: e.target.value })
              }
              placeholder="e.g. SP"
            />
          </div>

          <div className="col-span-2 space-y-3 pt-2">
            <Label>Attributes</Label>
            <MultiSelect
              options={attributeTypes.map((type) => ({
                label: type.listValue,
                value: type.id,
              }))}
              selected={formData.attributes || []}
              onChange={(selected) =>
                setFormData({ ...formData, attributes: selected as number[] })
              }
              placeholder="Select Attributes..."
              contentClassName="w-[450px]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Items;
