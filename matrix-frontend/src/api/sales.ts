import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";
import { API_ENDPOINTS } from "@/config/apiEndpoints";

export interface SaleLineItem {
  itemId: number;
  itemName?: string;
  itemGroupId?: number;
  itemGroupName?: string;
  quantity: number;
  weight?: number;
  rate: number;
  amount: number;
}

export interface Sale {
  id: number;
  voucherNo: string;
  voucherDate: string;
  daybookId?: number;
  daybookName?: string;
  partyId?: number;
  partyName?: string;
  reference: string;
  remarks: string;
  itemLines: SaleLineItem[];
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  roundOff: number;
  grandTotal: number;
  isActive: boolean;
  status: "Draft" | "Posted" | "Cancelled";
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  summary?: any[];
  error?: string;
  message?: string;
}

export const getSales = async (): Promise<ApiResponse<Sale[]>> => {
  const { data } = await apiClient.get<ApiResponse<Sale[]>>(
    API_ENDPOINTS.SALES.BASE,
  );
  return data;
};

export const getSale = async (id: number): Promise<Sale> => {
  const { data } = await apiClient.get<ApiResponse<Sale>>(
    API_ENDPOINTS.SALES.BY_ID(id),
  );
  return data.data;
};

export const createSale = async (sale: Omit<Sale, "id">): Promise<Sale> => {
  const { data } = await apiClient.post<ApiResponse<Sale>>(
    API_ENDPOINTS.SALES.BASE,
    sale,
  );
  return data.data;
};

export const updateSale = async (
  id: number,
  sale: Partial<Sale>,
): Promise<Sale> => {
  const { data } = await apiClient.put<ApiResponse<Sale>>(
    API_ENDPOINTS.SALES.BY_ID(id),
    sale,
  );
  return data.data;
};

export const deleteSale = async (id: number): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.SALES.BY_ID(id));
};

export const useSales = () => {
  return useQuery({
    queryKey: ["sales"],
    queryFn: getSales,
  });
};

export const useSale = (id?: number) => {
  return useQuery({
    queryKey: ["sales", id],
    queryFn: () => getSale(id!),
    enabled: !!id,
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });
};

export const useUpdateSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Sale> }) =>
      updateSale(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });
};

export const useDeleteSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });
};
