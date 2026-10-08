import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";
import { API_ENDPOINTS } from "@/config/apiEndpoints";

export interface OrderLineItem {
  id?: string | number;
  orderId?: number;
  itemId: number;
  itemName?: string;
  itemCode?: string;
  itemGroupId?: number;
  itemGroupName?: string;
  tagNo?: string;
  pcs: number;
  uom?: string;
  weight?: number;
  grossWt?: number;
  netWt?: number;
  adjustedWt?: number;
  fineWt?: number;
  rate: number;
  rateTypeId?: number;
  rateType?: string;
  tax?: string;
  labourAmount?: number;
  otherAmount?: number;
  discountAmount?: number;
  amount: number;
  taxableAmount?: number;
  amountWithTax?: number;
}

export interface Order {
  id: number;
  voucherNo: string;
  srNo?: number;
  voucherDate: string;
  daybookId?: number;
  daybookName?: string;
  daybookGroupName?: string;
  accountId?: number;
  accountName?: string;
  reference?: string;
  remarks?: string;
  salesmanName?: string;
  billMode?: string;
  // Customer details
  customerPhone?: string;
  customerAltPhone?: string;
  customerAddress1?: string;
  customerAddress2?: string;
  customerCityId?: number;
  customerCity?: string;
  customerAreaId?: number;
  customerArea?: string;
  customerPincode?: string;
  customerState?: string;
  customerGstNo?: string;
  customerPanNo?: string;
  customerAadharNo?: string;
  customerEmail?: string;
  // Financial & Settlement
  itemLines: OrderLineItem[];
  totalTaxableAmount?: number;
  totalAmount?: number;
  osAmount?: number;
  subtotal?: number;
  discountRate?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  roundOff?: number;
  grandTotal?: number;
  // Payments
  advanceAmount?: number;
  urdAmount?: number;
  cashAmount?: number;
  bankAmount?: number;
  bankName?: string;
  cardAmount?: number;
  cardCommission?: number;
  schemeAmount?: number;
  giftVoucherAmount?: number;
  salesReturnAmount?: number;
  kasarAmount?: number;
  tdsAmount?: number;
  rateFixType?: string;
  dueDate?: string;
  deliveryPending?: boolean;
  status?: "Draft" | "Posted" | "Cancelled";
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  summary?: any[];
  error?: string;
  message?: string;
}

export const getOrders = async (): Promise<ApiResponse<Order[]>> => {
  const { data } = await apiClient.post<ApiResponse<Order[]>>(
    API_ENDPOINTS.ORDERS.BASE,
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

export const useOrders = () => {
  return useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
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
