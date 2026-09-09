import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import type { TransactionType } from "@/constants/enums";

export interface PaymentDetail {
  id?: number;
  paymentId?: number;
  accountId: number;
  accountName?: string;
  amount: number;
  remarks?: string;
}

export interface Payment {
  id: number;
  voucherNo: string;
  srNo?: number;
  voucherDate: string;
  transactionType: TransactionType;
  daybookId: number;
  daybookName?: string;
  daybookGroupName?: string;
  accountId: number; // Primary cash or bank account
  accountName?: string;
  accountNo?: string;
  reference?: string;
  chequeNo?: string;
  chequeDate?: string;
  totalAmount: number;
  remarks?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  details: PaymentDetail[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  summary?: any[];
  error?: string;
  message?: string;
}

export const getPayments = async (params?: {
  transactionType?: string;
  search?: string;
}): Promise<ApiResponse<Payment[]>> => {
  const { data } = await apiClient.post<ApiResponse<Payment[]>>(
    API_ENDPOINTS.PAYMENTS.BASE,
    params,
    { params },
  );
  return data;
};

export const getPayment = async (id: number): Promise<Payment> => {
  const { data } = await apiClient.get<ApiResponse<Payment>>(
    API_ENDPOINTS.PAYMENTS.BY_ID(id),
  );
  if (data?.data) {
    return data.data;
  }
  throw new Error(`Payment voucher #${id} not found`);
};

export const createPayment = async (
  payment: Omit<Payment, "id">,
): Promise<Payment> => {
  const { data } = await apiClient.post<ApiResponse<Payment>>(
    "/payments/create",
    payment,
  );
  if (data?.data) {
    return data.data;
  }
  throw new Error(data?.error || "Failed to create payment voucher");
};

export const updatePayment = async (
  id: number,
  payment: Partial<Payment>,
): Promise<Payment> => {
  const { data } = await apiClient.put<ApiResponse<Payment>>(
    API_ENDPOINTS.PAYMENTS.BY_ID(id),
    payment,
  );
  if (data?.data) {
    return data.data;
  }
  throw new Error(data?.error || `Failed to update payment voucher #${id}`);
};

export const deletePayment = async (id: number): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.PAYMENTS.BY_ID(id));
};

export const usePayments = (params?: {
  transactionType?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["payments", params?.transactionType, params?.search],
    queryFn: () => getPayments(params),
  });
};

export const usePayment = (id?: number) => {
  return useQuery({
    queryKey: ["payments", id],
    queryFn: () => getPayment(id!),
    enabled: !!id,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Payment> }) =>
      updatePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
};
