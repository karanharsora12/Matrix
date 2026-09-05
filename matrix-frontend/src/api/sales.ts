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
  partyId?: number;
  partyName?: string;
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

const STORAGE_KEY = "matrix_sales_vouchers";

const INITIAL_SALES: Sale[] = [
  {
    id: 1,
    voucherNo: "HRIA-215",
    voucherDate: new Date().toISOString().slice(0, 10),
    daybookId: 1,
    daybookName: "RETAIL INVOICE",
    partyId: 1,
    partyName: "Rahul Sharma",
    reference: "REF-2026-981",
    remarks: "Wedding purchase. Complimentary cleaning warranty included.",
    salesmanName: "Amit Verma",
    billMode: "Debit Memo",
    customerPhone: "9876543210",
    customerAltPhone: "9123456780",
    customerAddress1: "B-402, Shivalik Heights, CG Road",
    customerAddress2: "Navrangpura",
    customerCity: "Ahmedabad",
    customerPincode: "380009",
    customerState: "Gujarat",
    customerGstNo: "24AAACH7409R1ZZ",
    customerPanNo: "ABCDE1234F",
    customerAadharNo: "4532 8901 2341",
    customerEmail: "rahul.sharma@example.com",
    itemLines: [
      {
        id: "item-1",
        tagNo: "TAG-GLD-101",
        itemId: 1,
        itemName: "22K Gold Antique Choker",
        itemGroupId: 1,
        itemGroupName: "Gold Jewellery",
        quantity: 1,
        grossWt: 35.45,
        netWt: 34.8,
        adjustedWt: 34.8,
        fineWt: 31.88,
        rate: 7250,
        labourAmount: 18500,
        otherAmount: 0,
        discountAmount: 2000,
        amount: 268800,
      },
      {
        id: "item-2",
        tagNo: "TAG-DMD-204",
        itemId: 2,
        itemName: "Solitaire Diamond Ring 1.2ct",
        itemGroupId: 2,
        itemGroupName: "Diamond Jewellery",
        quantity: 1,
        grossWt: 4.85,
        netWt: 4.61,
        adjustedWt: 4.61,
        fineWt: 3.45,
        rate: 115000,
        labourAmount: 12000,
        otherAmount: 1500,
        discountAmount: 5000,
        amount: 123500,
      },
    ],
    subtotal: 392300,
    discountRate: 0,
    discountAmount: 7000,
    taxRate: 3,
    taxAmount: 11769,
    roundOff: -0.3,
    grandTotal: 404069,
    cashAmount: 50000,
    bankAmount: 200000,
    bankName: "HDFC Bank",
    cardAmount: 100000,
    advanceAmount: 50000,
    urdAmount: 4069,
    kasarAmount: 0,
    tdsAmount: 0,
    rateFixType: "Fix",
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    deliveryPending: false,
    isActive: true,
    status: "Posted",
  },
  {
    id: 2,
    voucherNo: "RET-2026-0043",
    voucherDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    daybookId: 1,
    daybookName: "RETAIL INVOICE",
    partyId: 2,
    partyName: "Pooja Patel",
    reference: "INQ-4481",
    remarks: "Hallmarked 92.5 Sterling Silver items.",
    salesmanName: "Sneha Dave",
    billMode: "Cash",
    customerPhone: "9988776655",
    customerAddress1: "12, Silver Oak Society",
    customerCity: "Surat",
    customerPincode: "395007",
    customerState: "Gujarat",
    customerPanNo: "BQWPR8891K",
    itemLines: [
      {
        id: "item-3",
        tagNo: "TAG-SLV-015",
        itemId: 3,
        itemName: "Silver Anklet Pair 925",
        itemGroupId: 3,
        itemGroupName: "Silver Ornaments",
        quantity: 1,
        grossWt: 84.5,
        netWt: 82.0,
        fineWt: 75.85,
        rate: 95,
        labourAmount: 1200,
        discountAmount: 200,
        amount: 8790,
      },
    ],
    subtotal: 8790,
    discountRate: 0,
    discountAmount: 200,
    taxRate: 3,
    taxAmount: 263.7,
    roundOff: 0.3,
    grandTotal: 9054,
    cashAmount: 9054,
    bankAmount: 0,
    cardAmount: 0,
    advanceAmount: 0,
    urdAmount: 0,
    isActive: true,
    status: "Posted",
  },
];

const getStoredSales = (): Sale[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SALES));
      return INITIAL_SALES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SALES;
  }
};

const saveStoredSales = (sales: Sale[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
  } catch (err) {
    console.error("Failed to persist sales in localStorage", err);
  }
};

export const getSales = async (): Promise<ApiResponse<Sale[]>> => {
  try {
    const { data } = await apiClient.get<ApiResponse<Sale[]>>(
      API_ENDPOINTS.SALES.BASE,
    );
    if (data?.data && Array.isArray(data.data)) {
      return data;
    }
  } catch {
    // Graceful fallback to local storage
  }
  const sales = getStoredSales();
  return { success: true, data: sales };
};

export const getSale = async (id: number): Promise<Sale> => {
  try {
    const { data } = await apiClient.get<ApiResponse<Sale>>(
      API_ENDPOINTS.SALES.BY_ID(id),
    );
    if (data?.data) {
      return data.data;
    }
  } catch {
    // Graceful fallback
  }
  const sales = getStoredSales();
  const found = sales.find((s) => s.id === id);
  if (!found) {
    throw new Error(`Sale voucher #${id} not found`);
  }
  return found;
};

export const createSale = async (sale: Omit<Sale, "id">): Promise<Sale> => {
  try {
    const { data } = await apiClient.post<ApiResponse<Sale>>(
      API_ENDPOINTS.SALES.BASE,
      sale,
    );
    if (data?.data) {
      return data.data;
    }
  } catch {
    // Fallback to local persistence
  }
  const sales = getStoredSales();
  const newId = sales.length ? Math.max(...sales.map((s) => s.id)) + 1 : 1;
  const newSale: Sale = { ...sale, id: newId };
  const updated = [newSale, ...sales];
  saveStoredSales(updated);
  return newSale;
};

export const updateSale = async (
  id: number,
  sale: Partial<Sale>,
): Promise<Sale> => {
  try {
    const { data } = await apiClient.put<ApiResponse<Sale>>(
      API_ENDPOINTS.SALES.BY_ID(id),
      sale,
    );
    if (data?.data) {
      return data.data;
    }
  } catch {
    // Fallback to local persistence
  }
  const sales = getStoredSales();
  const index = sales.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error(`Sale voucher #${id} not found`);
  }
  const updatedSale: Sale = { ...sales[index], ...sale };
  sales[index] = updatedSale;
  saveStoredSales([...sales]);
  return updatedSale;
};

export const deleteSale = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(API_ENDPOINTS.SALES.BY_ID(id));
  } catch {
    // Fallback to local persistence
  }
  const sales = getStoredSales();
  const filtered = sales.filter((s) => s.id !== id);
  saveStoredSales(filtered);
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
