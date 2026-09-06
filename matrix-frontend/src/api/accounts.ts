import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

// New: matches the paginated backend response shape (nextCursor/hasMore)
export interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  pagination: {
    nextCursor: number | null;
    hasMore: boolean;
    limit: number;
  };
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

// Updated: now accepts optional cursor/limit, returns pagination info
export const getAccounts = async (params?: {
  cursor?: number;
  limit?: number;
}): Promise<PaginatedResponse<Account[]>> => {
  const { data } = await apiClient.get<PaginatedResponse<Account[]>>(
    API_ENDPOINTS.ACCOUNTS.BASE,
    {
      params: {
        limit: params?.limit ?? 20,
        ...(params?.cursor !== undefined ? { cursor: params.cursor } : {}),
      },
    },
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

// Updated: useAccounts is now a cursor-based infinite query.
// BREAKING CHANGE: callers now get { data: { pages, pageParams }, fetchNextPage, hasNextPage, ... }
// instead of { data: ApiResponse<Account[]> }. Check for other usages before merging.
export const useAccounts = (limit = 20) => {
  return useInfiniteQuery({
    queryKey: ["accounts"],
    queryFn: ({ pageParam }) =>
      getAccounts({ cursor: pageParam as number | undefined, limit }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor ?? undefined : undefined,
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
