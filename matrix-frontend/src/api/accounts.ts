import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";

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

export const getAccountMasterData = async (): Promise<{
  accountTypes: AccountType[];
  accountGroups: AccountGroup[];
}> => {
  const { data } = await apiClient.get("/accounts/master-data");
  return data;
};

export const getAccounts = async (): Promise<Account[]> => {
  const { data } = await apiClient.get("/accounts");
  return data;
};

export const createAccount = async (
  account: Omit<Account, "id">
): Promise<Account> => {
  const { data } = await apiClient.post("/accounts", account);
  return data;
};

export const updateAccount = async (
  id: number,
  account: Partial<Account>
): Promise<Account> => {
  const { data } = await apiClient.put(`/accounts/${id}`, account);
  return data;
};

export const deleteAccount = async (id: number): Promise<void> => {
  await apiClient.delete(`/accounts/${id}`);
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
