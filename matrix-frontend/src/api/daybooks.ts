import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
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
  const { data } = await apiClient.get<ApiResponse<DaybookGroup[]>>(
    API_ENDPOINTS.DAYBOOKS.GROUPS,
  );
  return data;
};

export const createDaybookGroup = async (
  group: Omit<DaybookGroup, "id">,
): Promise<DaybookGroup> => {
  const { data } = await apiClient.post<ApiResponse<DaybookGroup>>(
    API_ENDPOINTS.DAYBOOKS.GROUPS,
    group,
  );
  return data.data;
};

export const updateDaybookGroup = async (
  id: number,
  group: Partial<DaybookGroup>,
): Promise<DaybookGroup> => {
  const { data } = await apiClient.put<ApiResponse<DaybookGroup>>(
    API_ENDPOINTS.DAYBOOKS.GROUP_BY_ID(id),
    group,
  );
  return data.data;
};

export const deleteDaybookGroup = async (id: number): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.DAYBOOKS.GROUP_BY_ID(id));
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
  const { data } = await apiClient.get<ApiResponse<Daybook[]>>(
    API_ENDPOINTS.DAYBOOKS.BASE,
  );
  return data;
};

export const createDaybook = async (
  daybook: Omit<Daybook, "id">,
): Promise<Daybook> => {
  const { data } = await apiClient.post<ApiResponse<Daybook>>(
    API_ENDPOINTS.DAYBOOKS.BASE,
    daybook,
  );
  return data.data;
};

export const updateDaybook = async (
  id: number,
  daybook: Partial<Daybook>,
): Promise<Daybook> => {
  const { data } = await apiClient.put<ApiResponse<Daybook>>(
    API_ENDPOINTS.DAYBOOKS.BY_ID(id),
    daybook,
  );
  return data.data;
};

export const deleteDaybook = async (id: number): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.DAYBOOKS.BY_ID(id));
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

export interface VoucherNoResponse {
  voucherNo: string;
  daybookId: number;
  voucherPrefix: string;
}

export const generateVoucherNo = async (
  daybookId: number,
): Promise<ApiResponse<VoucherNoResponse>> => {
  const { data } = await apiClient.get<ApiResponse<VoucherNoResponse>>(
    API_ENDPOINTS.DAYBOOKS.GENERATE_VOUCHER_NO(daybookId),
  );
  return data;
};
