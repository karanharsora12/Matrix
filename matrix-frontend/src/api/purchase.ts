import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";
import { API_ENDPOINTS } from "@/config/apiEndpoints";

export interface PurchaseLineItem {
  id?: string;
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
  rateType?: string;
  tax?: string;
  labourAmount?: number;
  otherAmount?: number;
  discountAmount?: number;
  amount: number;
}

export interface Purchase {
  id: number;
  voucherNo: string;
  srNo?: number;
  voucherDate: string;
  daybookId?: number;
  daybookName?: string;
  accountId?: number;
  accountName?: string;
  reference: string;
  remarks: string;
  purchaserName?: string;
  billMode?: string;
  // Supplier details
  supplierPhone?: string;
  supplierAltPhone?: string;
  supplierAddress1?: string;
  supplierAddress2?: string;
  supplierCity?: string;
  supplierPincode?: string;
  supplierState?: string;
  supplierGstNo?: string;
  supplierPanNo?: string;
  supplierAadharNo?: string;
  supplierEmail?: string;
  // Financial & Settlement
  itemLines: PurchaseLineItem[];
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  roundOff: number;
  grandTotal: number;
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
  purchaseReturnAmount?: number;
  kasarAmount?: number;
  tdsAmount?: number;
  rateFixType?: string;
  dueDate?: string;
  deliveryPending?: boolean;
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

export const getPurchases = async (): Promise<ApiResponse<Purchase[]>> => {
  const { data } = await apiClient.post<ApiResponse<Purchase[]>>(
    API_ENDPOINTS.PURCHASE.BASE,
  );
  return data;
};

export const getPurchase = async (id: number): Promise<Purchase> => {
  const { data } = await apiClient.get<ApiResponse<Purchase>>(
    API_ENDPOINTS.PURCHASE.BY_ID(id),
  );
  if (data?.data) {
    return data.data;
  }
  throw new Error(`Purchase voucher #${id} not found`);
};

export const createPurchase = async (
  purchase: Omit<Purchase, "id">,
): Promise<Purchase> => {
  const { data } = await apiClient.post<ApiResponse<Purchase>>(
    "/purchases/create",
    purchase,
  );
  if (data?.data) {
    return data.data;
  }
  throw new Error("Failed to create purchase");
};

export const updatePurchase = async (
  id: number,
  purchase: Partial<Purchase>,
): Promise<Purchase> => {
  const { data } = await apiClient.put<ApiResponse<Purchase>>(
    API_ENDPOINTS.PURCHASE.BY_ID(id),
    purchase,
  );
  if (data?.data) {
    return data.data;
  }
  throw new Error(`Failed to update purchase #${id}`);
};

export const deletePurchase = async (id: number): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.PURCHASE.BY_ID(id));
};

export const usePurchases = () => {
  return useQuery({
    queryKey: ["purchases"],
    queryFn: getPurchases,
  });
};

export const usePurchase = (id?: number) => {
  return useQuery({
    queryKey: ["purchases", id],
    queryFn: () => getPurchase(id!),
    enabled: !!id,
  });
};

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
};

export const useUpdatePurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Purchase> }) =>
      updatePurchase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
};

export const useDeletePurchase = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
};
