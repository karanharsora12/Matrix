import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";
import { API_ENDPOINTS } from "@/config/apiEndpoints";

export interface SaleLineItem {
  id?: string;
  itemId: number;
  itemName?: string;
  itemCode?: string;
  itemGroupId?: number;
  itemGroupName?: string;
  tagNo?: string;
  quantity: number;
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

export interface Sale {
  id: number;
  voucherNo: string;
  voucherDate: string;
  daybookId?: number;
  daybookName?: string;
  accountId?: number;
  accountName?: string;
  reference: string;
  remarks: string;
  salesmanName?: string;
  billMode?: string;
  // Customer details
  customerPhone?: string;
  customerAltPhone?: string;
  customerAddress1?: string;
  customerAddress2?: string;
  customerCity?: string;
  customerPincode?: string;
  customerState?: string;
  customerGstNo?: string;
  customerPanNo?: string;
  customerAadharNo?: string;
  customerEmail?: string;
  // Financial & Settlement
  itemLines: SaleLineItem[];
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
  salesReturnAmount?: number;
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
  if (data?.data) {
    return data.data;
  }
  throw new Error(`Sale voucher #${id} not found`);
};

export const createSale = async (sale: Omit<Sale, "id">): Promise<Sale> => {
  const { data } = await apiClient.post<ApiResponse<Sale>>(
    API_ENDPOINTS.SALES.BASE,
    sale,
  );
  if (data?.data) {
    return data.data;
  }
  throw new Error("Failed to create sale");
};

export const updateSale = async (
  id: number,
  sale: Partial<Sale>,
): Promise<Sale> => {
  const { data } = await apiClient.put<ApiResponse<Sale>>(
    API_ENDPOINTS.SALES.BY_ID(id),
    sale,
  );
  if (data?.data) {
    return data.data;
  }
  throw new Error(`Failed to update sale #${id}`);
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
