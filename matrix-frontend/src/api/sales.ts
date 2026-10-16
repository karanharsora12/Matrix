import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";
import { API_ENDPOINTS } from "@/config/apiEndpoints";

export interface SaleLineItem {
  id?: string | number;
  saleId?: number;
  receiptItemId?: number | null;
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

export interface Sale {
  id: number;
  voucherNo: string;
  srNo?: number | null;
  voucherDate: string;
  daybookId?: number | null;
  daybookName?: string | null;
  daybookGroupName?: string | null;
  accountId?: number | null;
  accountName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  receiptId?: number | null;
  receiptVoucherNo?: string | null;
  salesmanName?: string | null;
  customerReference?: string | null;
  reference?: string | null;
  remarks?: string | null;
  billMode?: string | null;

  itemCount?: number;
  totalPcs?: number | string;

  // Financials
  itemLines: SaleLineItem[];
  subtotal: number | string;
  discountRate: number | string;
  discountAmount: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  roundOff: number | string;
  grandTotal: number | string;

  // Payments / Settlement
  advanceAmount?: number | string;
  advanceAdjusted?: number | string;
  cashAmount?: number | string;
  bankAmount?: number | string;
  cashDaybookId?: number | null;
  bankDaybookId?: number | null;
  cashReference?: string | null;
  bankReference?: string | null;
  settledAmount?: number | string;
  balanceAmount?: number | string;

  dueDate?: string | null;
  deliveryPending?: boolean;
  addBy?: string | number | null;
  editBy?: string | number | null;
  createdAt?: string;
  updatedAt?: string;
}

export type RepairingBill = Sale;
export type RepairingBillItem = SaleLineItem;

export interface EligibleReceipt {
  id: number;
  voucherNo: string;
  voucherDate: string;
  accountId: number;
  accountName: string;
  customerPhone: string;
  salesmanName?: string | null;
  remarks?: string | null;
  subtotal: number | string;
  grandTotal: number | string;
  advanceAmount: number | string;
  advancePaid: number;
  itemCount: number;
  itemLines: SaleLineItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  summary?: any[];
  error?: string;
  message?: string;
}

export const getSales = async (
  params?: Record<string, any>,
): Promise<ApiResponse<Sale[]>> => {
  const { data } = await apiClient.post<ApiResponse<Sale[]>>(
    API_ENDPOINTS.SALES.BASE,
    params,
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
  throw new Error(`Repairing bill #${id} not found`);
};

export const getEligibleReceipts = async (params?: {
  excludeSaleId?: number;
  search?: string;
  accountId?: number;
}): Promise<EligibleReceipt[]> => {
  const { data } = await apiClient.get<ApiResponse<EligibleReceipt[]>>(
    API_ENDPOINTS.SALES.ELIGIBLE_RECEIPTS,
    { params },
  );
  return data?.data || [];
};

export const createSale = async (sale: Omit<Sale, "id">): Promise<Sale> => {
  const { data } = await apiClient.post<ApiResponse<Sale>>(
    `${API_ENDPOINTS.SALES.BASE}/create`,
    sale,
  );
  if (data?.data) {
    return data.data;
  }
  throw new Error("Failed to create repairing bill");
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
  throw new Error(`Failed to update repairing bill #${id}`);
};

export const deleteSale = async (id: number): Promise<void> => {
  await apiClient.delete(API_ENDPOINTS.SALES.BY_ID(id));
};

export const useSales = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ["sales", params],
    queryFn: () => getSales(params),
  });
};

export const useSale = (id?: number) => {
  return useQuery({
    queryKey: ["sales", id],
    queryFn: () => getSale(id!),
    enabled: !!id,
  });
};

export const useEligibleReceipts = (params?: {
  excludeSaleId?: number;
  search?: string;
  accountId?: number;
}) => {
  return useQuery({
    queryKey: ["eligible-receipts", params],
    queryFn: () => getEligibleReceipts(params),
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["eligible-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
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
      queryClient.invalidateQueries({ queryKey: ["eligible-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useDeleteSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["eligible-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};
