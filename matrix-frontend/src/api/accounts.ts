import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";
import { API_ENDPOINTS } from "@/config/apiEndpoints";

export interface AccountType {
  id: number;
  name: string;
  description: string | null;
}

export interface AccountGroup {
  id: number;
  name: string;
  description: string | null;
  accountTypeId: number;
}

export interface Account {
  id: number;
  accountName: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  userName: string;
  email: string;
  accountTypeId: number;
  accountGroupId: number;
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  summary?: any[];
  error?: string;
  message?: string;
}

export const getAccountMasterData = async (): Promise<{
  accountTypes: AccountType[];
  accountGroups: AccountGroup[];
}> => {
  const { data } = await apiClient.get<
    ApiResponse<{
      accountTypes: AccountType[];
      accountGroups: AccountGroup[];
    }>
  >(API_ENDPOINTS.ACCOUNTS.MASTER_DATA);
  return data.data;
};

export const getAccounts = async (): Promise<ApiResponse<Account[]>> => {
  const { data } = await apiClient.get<ApiResponse<Account[]>>(
    API_ENDPOINTS.ACCOUNTS.BASE,
  );
  return data;
};

export const getAccount = async (id: number): Promise<Account> => {
  const { data } = await apiClient.get<ApiResponse<Account>>(
    API_ENDPOINTS.ACCOUNTS.BY_ID(id),
  );
  return data.data;
};

export const createAccount = async (
  account: Omit<Account, "id">,
): Promise<Account> => {
  const { data } = await apiClient.post<ApiResponse<Account>>(
    API_ENDPOINTS.ACCOUNTS.BASE,
    account,
  );
  return data.data;
};

export const updateAccount = async (
  id: number,
  account: Partial<Account>,
): Promise<Account> => {
  const { data } = await apiClient.put<ApiResponse<Account>>(
    API_ENDPOINTS.ACCOUNTS.BY_ID(id),
    account,
  );
  return data.data;
};

export const deleteAccount = async (id: number): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.ACCOUNTS.BY_ID(id));
};

export const useAccountMasterData = () => {
  return useQuery({
    queryKey: ["accountMasterData"],
    queryFn: getAccountMasterData,
  });
};

export const useAccounts = () => {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });
};

export const useAccount = (id?: number) => {
  return useQuery({
    queryKey: ["accounts", id],
    queryFn: () => getAccount(id!),
    enabled: !!id,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Account> }) =>
      updateAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};
