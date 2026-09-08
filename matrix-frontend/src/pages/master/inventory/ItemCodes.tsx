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
  useItemCodes,
  useCreateItemCode,
  useUpdateItemCode,
  useDeleteItemCode,
  useItems,
} from "@/api/inventory";
import type { ItemCode, Item } from "@/api/inventory";
import { ActiveCellRenderer } from "@/components/common/ActiveCellRenderer";
import type { ColDef } from "ag-grid-community";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ItemCodes: React.FC = () => {
  const queryClient = useQueryClient();
  const { gridRef, onExportExcel, onExportPdf, onPrint } = useGridActions();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemCode, setEditingItemCode] = useState<ItemCode | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ItemCode>>({
    itemId: undefined,
    itemCodeName: "",
    isActive: true,
    attributeValues: [],
  });

  const { commonLists, attributes: allAttributes } = useSelector(
    (state: RootState) => state.inventory,
  );

  const { data: itemsResponse } = useItems();
  const items = itemsResponse?.data || [];

  const createMutation = useCreateItemCode();
  const updateMutation = useUpdateItemCode();
  const deleteMutation = useDeleteItemCode();

  const handleAdd = () => {
    resetForm();
    setEditingItemCode(null);
    setIsModalOpen(true);
  };

  const handleEdit = (itemCode: ItemCode) => {
    setEditingItemCode(itemCode);
    setFormData({
      ...itemCode,
      attributeValues: itemCode.attributeValues || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirmAlert({
      title: "Confirm Delete",
      description:
        "Are you sure you want to delete this item code? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });

    if (isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      itemId: undefined,
      itemCodeName: "",
      isActive: true,
      attributeValues: [],
    });
  };

  const handleSave = () => {
    if (!formData.itemCodeName?.trim() || !formData.itemId) {
      return;
    }

    if (editingItemCode) {
      updateMutation.mutate(
        { id: editingItemCode.id, data: formData },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            resetForm();
          },
        },
      );
    } else {
      createMutation.mutate(formData as Omit<ItemCode, "id">, {
        onSuccess: () => {
          setIsModalOpen(false);
          resetForm();
        },
      });
    }
  };

  const columnDefs = useMemo<ColDef[]>(() => {
    return [
      { field: "id", headerName: "ID", width: 60, type: "numericColumn" },
      { field: "itemCodeName", headerName: "Item Code", width: 200 },
      {
        headerName: "Item",
        width: 200,
        valueGetter: (params) => {
          if (params.node?.rowPinned) return "";
          const item = items.find((i) => i.id === params.data.itemId);
          return item ? item.itemName : "";
        },
      },
      {
        headerName: "Attribute Values",
        width: 300,
        valueGetter: (params) => {
          if (params.node?.rowPinned) return "";
          const attrValues = params.data.attributeValues || [];
          return attrValues
            .map((attrId: number) => {
              const attr = allAttributes.find((a) => a.id === attrId);
              return attr ? attr.attributeValue : "";
            })
            .filter(Boolean)
            .join(", ");
        },
      },
      {
        field: "isActive",
        headerName: "Active",
        width: 65,
        cellRenderer: ActiveCellRenderer,
        cellStyle: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
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
  }, [items, allAttributes]);

  // Handle dynamic dropdowns based on selected item
  const selectedItem = useMemo(() => {
    if (!formData.itemId) return null;
    return items.find((i) => i.id === formData.itemId) || null;
  }, [formData.itemId, items]);

  const handleAttributeChange = (
    attributeCategoryId: number,
    valueId: number | null,
  ) => {
    const validCategoryAttributes = allAttributes
      .filter((a) => a.attributeNameId === attributeCategoryId)
      .map((a) => a.id);

    const newAttributeValues = (formData.attributeValues || []).filter(
      (val) => !validCategoryAttributes.includes(val),
    );

    if (valueId !== null) {
      newAttributeValues.push(valueId);
    }
    setFormData({ ...formData, attributeValues: newAttributeValues });
  };

  const getSelectedAttributeValueForCategory = (categoryId: number) => {
    const validCategoryAttributes = allAttributes
      .filter((a) => a.attributeNameId === categoryId)
      .map((a) => a.id);

    const selected = (formData.attributeValues || []).find((val) =>
      validCategoryAttributes.includes(val),
    );
    return selected ? selected.toString() : "";
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <ListingHeader
        title="Item Codes"
        subtitle="Manage your specific item variants and codes"
        onAdd={handleAdd}
        addText="Add Item Code"
        searchProps={{
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          placeholder: "Search item codes...",
        }}
        onRefresh={() =>
          queryClient.invalidateQueries({ queryKey: ["itemCodes"] })
        }
        onExportExcel={() => onExportExcel("ItemCodes")}
        onExportPdf={() => onExportPdf("Item Codes List", "ItemCodes")}
        onPrint={() => onPrint("Item Codes List")}
      />

      <DataGrid
        ref={gridRef}
        apiName={API_ENDPOINTS.INVENTORY.ITEM_CODES}
        infiniteScroll={false}
        columnDefs={columnDefs}
        gridOptions={{
          onRowDoubleClicked: (e) => {
            if (e.node.rowPinned) return;
            handleEdit(e.data);
          },
          pagination: false,
        }}
      />

      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingItemCode ? "Edit Item Code" : "Add Item Code"}
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
          <div className="space-y-2 col-span-2 sm:col-span-1">
            <Label htmlFor="itemCodeName">Item Code</Label>
            <Input
              id="itemCodeName"
              value={formData.itemCodeName || ""}
              onChange={(e) =>
                setFormData({ ...formData, itemCodeName: e.target.value })
              }
              placeholder="e.g. TSHIRT-RED-L"
            />
          </div>

          <div className="space-y-2 col-span-2 sm:col-span-1">
            <Label>Item</Label>
            <Select
              value={formData.itemId ? formData.itemId.toString() : ""}
              onValueChange={(val) =>
                setFormData({
                  ...formData,
                  itemId: parseInt(val, 10),
                  attributeValues: [],
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.itemName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedItem &&
            selectedItem.attributes &&
            selectedItem.attributes.length > 0 && (
              <div className="col-span-2 space-y-4 pt-2 border-t mt-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider">
                  Attributes for {selectedItem.itemName}
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {selectedItem.attributes.map((attrCategoryId) => {
                    const category = commonLists.find(
                      (c) => c.id === attrCategoryId,
                    );
                    const categoryName = category
                      ? category.listValue
                      : `Category ${attrCategoryId}`;
                    const options = allAttributes.filter(
                      (a) => a.attributeNameId === attrCategoryId,
                    );
                    const selectedVal =
                      getSelectedAttributeValueForCategory(attrCategoryId);

                    return (
                      <div key={attrCategoryId} className="space-y-2">
                        <Label>{categoryName}</Label>
                        <Select
                          value={selectedVal}
                          onValueChange={(val) =>
                            handleAttributeChange(
                              attrCategoryId,
                              parseInt(val, 10),
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={`Select ${categoryName}`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {options.map((opt) => (
                              <SelectItem
                                key={opt.id}
                                value={opt.id.toString()}
                              >
                                {opt.attributeValue}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>
      </Modal>
    </div>
  );
};

export default ItemCodes;
