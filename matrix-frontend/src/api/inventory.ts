import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";

export interface Metal {
  id: number;
  name: string;
}

export interface RateType {
  id: number;
  name: string;
}

export interface CommonList {
  id: number;
  listType: string;
  listValue: string;
}

export interface ItemGroup {
  id: number;
  itemGroupName: string;
  shortName: string;
  metalTypeId: number;
  salesRate: number;
  purchaseRate: number;
  salesRateTypeId: number;
  purchaseRateTypeId: number;
  measureUnitCode: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  summary?: any[];
  error?: string;
  message?: string;
}

export const getMasterData = async (): Promise<{
  metals: Metal[];
  rateTypes: RateType[];
  commonLists: CommonList[];
  attributes: Attribute[];
}> => {
  const { data } = await apiClient.get<ApiResponse<any>>("/inventory/master-data");
  return data.data;
};

export const getItemGroups = async (): Promise<ApiResponse<ItemGroup[]>> => {
  const { data } = await apiClient.get<ApiResponse<ItemGroup[]>>("/inventory/item-groups");
  return data;
};

export const createItemGroup = async (
  group: Omit<ItemGroup, "id">
): Promise<ItemGroup> => {
  const { data } = await apiClient.post<ApiResponse<ItemGroup>>("/inventory/item-groups", group);
  return data.data;
};

export const updateItemGroup = async (
  id: number,
  group: Partial<ItemGroup>
): Promise<ItemGroup> => {
  const { data } = await apiClient.put<ApiResponse<ItemGroup>>(`/inventory/item-groups/${id}`, group);
  return data.data;
};

export const deleteItemGroup = async (id: number): Promise<void> => {
  await apiClient.delete(`/inventory/item-groups/${id}`);
};

export const useItemGroups = () => {
  return useQuery({
    queryKey: ["itemGroups"],
    queryFn: getItemGroups,
  });
};

export const useCreateItemGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createItemGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itemGroups"] });
    },
  });
};

export const useUpdateItemGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ItemGroup> }) =>
      updateItemGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itemGroups"] });
    },
  });
};

export const useDeleteItemGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteItemGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itemGroups"] });
    },
  });
};

export interface Attribute {
  id: number;
  attributeNameId: number;
  attributeValue: string;
}

export interface Item {
  id: number;
  itemName: string;
  shortName: string;
  isActive: boolean;
  attributes: number[];
}

export const getItems = async (): Promise<ApiResponse<Item[]>> => {
  const { data } = await apiClient.get<ApiResponse<Item[]>>("/inventory/items");
  return data;
};

export const createItem = async (item: Omit<Item, "id">): Promise<Item> => {
  const { data } = await apiClient.post<ApiResponse<Item>>("/inventory/items", item);
  return data.data;
};

export const updateItem = async (id: number, item: Partial<Item>): Promise<Item> => {
  const { data } = await apiClient.put<ApiResponse<Item>>(`/inventory/items/${id}`, item);
  return data.data;
};

export const deleteItem = async (id: number): Promise<void> => {
  await apiClient.delete(`/inventory/items/${id}`);
};

export const useItems = () => {
  return useQuery({
    queryKey: ["items"],
    queryFn: getItems,
  });
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Item> }) =>
      updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
};
