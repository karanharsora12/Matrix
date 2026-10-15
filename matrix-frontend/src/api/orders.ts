import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";
import { API_ENDPOINTS } from "@/config/apiEndpoints";

export interface OrderLineItem {
  id?: string | number;
  orderId?: number;
  itemId: number;
  itemName?: string;
  itemCode?: string;
  itemGroupId?: number | null;
  itemGroupName?: string | null;
  tagNo?: string | null;
  itemDescription?: string | null;
  itemRemarks?: string | null;
  pcs: number;
  uom?: string | null;
  weight?: number;
  grossWt?: number;
  netWt?: number;
  adjustedWt?: number;
  fineWt?: number;
  rate: number;
  labourRate?: number;
  rateTypeId?: number | null;
  rateType?: string | null;
  tax?: string | null;
  labourAmount?: number;
  otherAmount?: number;
  discountAmount?: number;
  amount: number;
  deliveryDate?: string | null;
}

export interface Order {
  id: number;
  voucherNo: string;
  srNo?: number | null;
  voucherDate: string;
  daybookId?: number | null;
  daybookName?: string | null;
  daybookGroupName?: string | null;
  accountId?: number | null;
  accountName?: string | null;
  reference?: string | null;
  remarks?: string | null;
  salesmanName?: string | null;
  billMode?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  itemCount?: number;
  totalPcs?: number | string;

  // Financials
  itemLines: OrderLineItem[];
  subtotal: number | string;
  discountRate: number | string;
  discountAmount: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  roundOff: number | string;
  grandTotal: number | string;

  // Payments / Settlement
  advanceAmount?: number | string;
  cashAmount?: number | string;
  bankAmount?: number | string;
  cashDaybookId?: number | null;
  bankDaybookId?: number | null;
  cashReference?: string | null;
  bankReference?: string | null;
  receivedAmount?: number | string;
  balanceAmount?: number | string;
  cardAmount?: number | string;

  dueDate?: string | null;
  deliveryPending?: boolean;
  addBy?: string | number | null;
  editBy?: string | number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  summary?: any[];
  error?: string;
  message?: string;
}

export const getOrders = async (params?: Record<string, any>): Promise<ApiResponse<Order[]>> => {
  const { data } = await apiClient.post<ApiResponse<Order[]>>(
    API_ENDPOINTS.ORDERS.BASE,
    params,
  );
  return data;
};

export const getOrder = async (id: number): Promise<Order> => {
  const { data } = await apiClient.get<ApiResponse<Order>>(
    API_ENDPOINTS.ORDERS.BY_ID(id),
  );
  if (data?.data) {
    return data.data;
  }
  throw new Error(`Order voucher #${id} not found`);
};

export const createOrder = async (order: Omit<Order, "id">): Promise<Order> => {
  const { data } = await apiClient.post<ApiResponse<Order>>(
    "/orders/create",
    order,
  );
  if (data?.data) {
    return data.data;
  }
  throw new Error("Failed to create order");
};

export const updateOrder = async (
  id: number,
  order: Partial<Order>,
): Promise<Order> => {
  const { data } = await apiClient.put<ApiResponse<Order>>(
    API_ENDPOINTS.ORDERS.BY_ID(id),
    order,
  );
  if (data?.data) {
    return data.data;
  }
  throw new Error(`Failed to update order #${id}`);
};

export const deleteOrder = async (id: number): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.ORDERS.BY_ID(id));
};

export const useOrders = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => getOrders(params),
  });
};

export const useOrder = (id?: number) => {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Order> }) =>
      updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};
