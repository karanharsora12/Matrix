import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";
import type { ApiResponse } from "./inventory";

export interface DaybookGroup {
  id: number;
  groupName: string;
  shortName: string;
  description?: string;
  isActive: boolean;
}

export interface Daybook {
  id: number;
  daybookName: string;
  shortName: string;
  daybookGroupId: number;
  voucherPrefix: string;
  allowManualNumber: boolean;
  description?: string;
  isActive: boolean;
}

// --- Daybook Groups API ---
export const getDaybookGroups = async (): Promise<
  ApiResponse<DaybookGroup[]>
> => {
  const { data } =
    await apiClient.get<ApiResponse<DaybookGroup[]>>("/daybooks/groups");
  return data;
};

export const createDaybookGroup = async (
  group: Omit<DaybookGroup, "id">,
): Promise<DaybookGroup> => {
  const { data } = await apiClient.post<ApiResponse<DaybookGroup>>(
    "/daybooks/groups",
    group,
  );
  return data.data;
};

export const updateDaybookGroup = async (
  id: number,
  group: Partial<DaybookGroup>,
): Promise<DaybookGroup> => {
  const { data } = await apiClient.put<ApiResponse<DaybookGroup>>(
    `/daybooks/groups/${id}`,
    group,
  );
  return data.data;
};

export const deleteDaybookGroup = async (id: number): Promise<void> => {
  await apiClient.delete(`/daybooks/groups/${id}`);
};

export const useDaybookGroups = () => {
  return useQuery({
    queryKey: ["daybookGroups"],
    queryFn: getDaybookGroups,
  });
};

export const useCreateDaybookGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDaybookGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daybookGroups"] });
    },
  });
};

export const useUpdateDaybookGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DaybookGroup> }) =>
      updateDaybookGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daybookGroups"] });
    },
  });
};

export const useDeleteDaybookGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDaybookGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daybookGroups"] });
    },
  });
};

// --- Daybooks API ---
export const getDaybooks = async (): Promise<ApiResponse<Daybook[]>> => {
  const { data } = await apiClient.get<ApiResponse<Daybook[]>>("/daybooks");
  return data;
};

export const createDaybook = async (
  daybook: Omit<Daybook, "id">,
): Promise<Daybook> => {
  const { data } = await apiClient.post<ApiResponse<Daybook>>(
    "/daybooks",
    daybook,
  );
  return data.data;
};

export const updateDaybook = async (
  id: number,
  daybook: Partial<Daybook>,
): Promise<Daybook> => {
  const { data } = await apiClient.put<ApiResponse<Daybook>>(
    `/daybooks/${id}`,
    daybook,
  );
  return data.data;
};

export const deleteDaybook = async (id: number): Promise<void> => {
  await apiClient.delete(`/daybooks/${id}`);
};

export const useDaybooks = () => {
  return useQuery({
    queryKey: ["daybooks"],
    queryFn: getDaybooks,
  });
};

export const useCreateDaybook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDaybook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daybooks"] });
    },
  });
};

export const useUpdateDaybook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Daybook> }) =>
      updateDaybook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daybooks"] });
    },
  });
};

export const useDeleteDaybook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDaybook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daybooks"] });
    },
  });
};
