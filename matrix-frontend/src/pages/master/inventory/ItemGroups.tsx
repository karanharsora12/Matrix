import React, { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useItemGroups,
  useCreateItemGroup,
  useUpdateItemGroup,
  useDeleteItemGroup,
} from "@/api/inventory";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import type { ItemGroup } from "@/api/inventory";
import { CommonListType } from "@/constants/enums";
import { ListingHeader } from "@/components/common/ListingHeader";
import { DataGrid } from "@/components/common/DataGrid";
import { Modal } from "@/components/common/Modal";
import { confirmAlert } from "@/components/common/AlertModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ColDef } from "ag-grid-community";
import { Trash2 } from "lucide-react";

const ItemGroups: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemGroup | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ItemGroup>>({
    itemGroupName: "",
    shortName: "",
    metalTypeId: undefined,
    salesRate: 0,
    purchaseRate: 0,
    salesRateTypeId: undefined,
    purchaseRateTypeId: undefined,
    measureUnitCode: "",
  });

  const { data: itemGroups = [], isLoading } = useItemGroups();
  
  const { metals, rateTypes, commonLists } = useSelector((state: RootState) => state.inventory);
  const measureUnits = commonLists.filter(c => c.listType === CommonListType.MEASURE_UNIT);

  const createMutation = useCreateItemGroup();
  const updateMutation = useUpdateItemGroup();
  const deleteMutation = useDeleteItemGroup();

  const handleAdd = () => {
    resetForm();
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: ItemGroup) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmAlert({
      title: "Confirm Delete",
      description: "Are you sure you want to delete this item group? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });

    if (isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      itemGroupName: "",
      shortName: "",
      metalTypeId: undefined,
      salesRate: 0,
      purchaseRate: 0,
      salesRateTypeId: undefined,
      purchaseRateTypeId: undefined,
      measureUnitCode: "",
    });
  };

  const handleSave = () => {
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
      createMutation.mutate(formData as Omit<ItemGroup, "id">, {
        onSuccess: () => {
          setIsModalOpen(false);
          resetForm();
        },
      });
    }
  };

  const columnDefs = useMemo<ColDef[]>(() => {
    return [
      { field: "id", headerName: "ID", width: 80 },
      { field: "itemGroupName", headerName: "Item Group Name" },
      { field: "shortName", headerName: "Short Name" },
      {
        field: "metalTypeId",
        headerName: "Metal",
        valueGetter: (params) => {
          const metal = metals.find((m) => m.id === params.data.metalTypeId);
          return metal ? metal.name : "";
        },
      },
      { field: "salesRate", headerName: "Sales Rate" },
      { field: "purchaseRate", headerName: "Purchase Rate" },
      {
        field: "salesRateTypeId",
        headerName: "Sales Rate Type",
        valueGetter: (params) => {
          const rt = rateTypes.find(
            (r) => r.id === params.data.salesRateTypeId,
          );
          return rt ? rt.name : "";
        },
      },
      {
        field: "purchaseRateTypeId",
        headerName: "Purchase Rate Type",
        valueGetter: (params) => {
          const rt = rateTypes.find(
            (r) => r.id === params.data.purchaseRateTypeId,
          );
          return rt ? rt.name : "";
        },
      },
      { field: "measureUnitCode", headerName: "Unit Code" },
      {
        headerName: "Actions",
        width: 120,
        cellRenderer: (params: any) => (
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600"
              onClick={() => handleDelete(params.data.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ];
  }, [metals, rateTypes]);

  const filteredData = itemGroups.filter((group) =>
    group.itemGroupName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <ListingHeader
        title="Item Groups"
        subtitle="Manage inventory item groups"
        onAdd={handleAdd}
        addText="Add Item Group"
        searchProps={{
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          placeholder: "Search item groups...",
        }}
        onRefresh={() =>
          queryClient.invalidateQueries({ queryKey: ["itemGroups"] })
        }
      />

      {!isLoading && (
        <DataGrid 
          rowData={filteredData} 
          columnDefs={columnDefs} 
          gridOptions={{ onRowDoubleClicked: (e) => handleEdit(e.data) }}
        />
      )}

      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingItem ? "Edit Item Group" : "Add Item Group"}
        width="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Item Group Name</Label>
            <Input
              value={formData.itemGroupName || ""}
              onChange={(e) =>
                setFormData({ ...formData, itemGroupName: e.target.value })
              }
              placeholder="e.g. Rings"
            />
          </div>
          <div className="space-y-2">
            <Label>Short Name</Label>
            <Input
              value={formData.shortName || ""}
              onChange={(e) =>
                setFormData({ ...formData, shortName: e.target.value })
              }
              placeholder="e.g. RNG"
            />
          </div>

          <div className="space-y-2">
            <Label>Metal Type</Label>
            <Select
              value={formData.metalTypeId?.toString() || ""}
              onValueChange={(val) =>
                setFormData({ ...formData, metalTypeId: parseInt(val) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Metal" />
              </SelectTrigger>
              <SelectContent>
                {metals.map((m) => (
                  <SelectItem key={m.id} value={m.id.toString()}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Measure Unit Code</Label>
            <Select
              value={formData.measureUnitCode || ""}
              onValueChange={(val) =>
                setFormData({ ...formData, measureUnitCode: val })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Unit" />
              </SelectTrigger>
              <SelectContent>
                {measureUnits.map((u) => (
                  <SelectItem key={u.id} value={u.listValue}>
                    {u.listValue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sales Rate</Label>
            <Input
              type="number"
              value={formData.salesRate || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  salesRate: parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Sales Rate Type</Label>
            <Select
              value={formData.salesRateTypeId?.toString() || ""}
              onValueChange={(val) =>
                setFormData({ ...formData, salesRateTypeId: parseInt(val) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Rate Type" />
              </SelectTrigger>
              <SelectContent>
                {rateTypes.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Purchase Rate</Label>
            <Input
              type="number"
              value={formData.purchaseRate || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  purchaseRate: parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Purchase Rate Type</Label>
            <Select
              value={formData.purchaseRateTypeId?.toString() || ""}
              onValueChange={(val) =>
                setFormData({ ...formData, purchaseRateTypeId: parseInt(val) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Rate Type" />
              </SelectTrigger>
              <SelectContent>
                {rateTypes.map((r) => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    {r.name}
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

export default ItemGroups;
