import apiClient from "./client";
import { API_ENDPOINTS } from "@/config/apiEndpoints";

export interface PrintConfigData {
  id?: number;
  transactionType: string;
  templateKey?: string;
  templateName?: string;
  isDefault?: boolean;
  paperSize?: string;
  orientation?: string;
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyGstin?: string | null;
  companyPan?: string | null;
  logoUrl?: string | null;
  showHeader?: boolean;
  showFooter?: boolean;
  showLogo?: boolean;
  headerTitle?: string | null;
  headerSubtitle?: string | null;
  footerText?: string | null;
  showCustomerDetails?: boolean;
  showVoucherDetails?: boolean;
  showItemCode?: boolean;
  showItemDescription?: boolean;
  showGrossWeight?: boolean;
  showNetWeight?: boolean;
  showLabour?: boolean;
  showRate?: boolean;
  showQuantity?: boolean;
  showDiscount?: boolean;
  showTax?: boolean;
  showAmount?: boolean;
  showTaxSummary?: boolean;
  showPaymentSummary?: boolean;
  showAdvancePaid?: boolean;
  showBalanceDue?: boolean;
  termsAndConditions?: string | null;
  showAuthorizedSignature?: boolean;
  showCustomerSignature?: boolean;
  signatureLabel?: string | null;
  defaultPostSaveAction?: "preview" | "print" | "none" | string;
  copies?: number;
  customTemplateHtml?: string | null;
  customTemplateCss?: string | null;
  isActive?: boolean;
}

export const fetchPrintConfig = async (
  transactionType: string,
  templateKey?: string
): Promise<PrintConfigData> => {
  const params: Record<string, string> = {};
  if (templateKey) params.templateKey = templateKey;
  const res = await apiClient.get(API_ENDPOINTS.REPORTS.CONFIG_BY_TYPE(transactionType), { params });
  return res.data.data;
};

export const fetchAllPrintConfigs = async (transactionType?: string): Promise<PrintConfigData[]> => {
  const params: Record<string, string> = {};
  if (transactionType) params.transactionType = transactionType;
  const res = await apiClient.get(API_ENDPOINTS.REPORTS.CONFIG, { params });
  return res.data.data;
};

export const savePrintConfig = async (config: PrintConfigData): Promise<PrintConfigData> => {
  const res = await apiClient.post(API_ENDPOINTS.REPORTS.CONFIG, config);
  return res.data.data;
};

export const resetPrintConfig = async (transactionType: string): Promise<PrintConfigData> => {
  const res = await apiClient.post(API_ENDPOINTS.REPORTS.RESET_CONFIG(transactionType));
  return res.data.data;
};

export const fetchTransactionPdfBlob = async (
  id: number | string,
  templateKey?: string
): Promise<{ blob: Blob; url: string }> => {
  const params: Record<string, string> = {};
  if (templateKey) params.templateKey = templateKey;

  const res = await apiClient.get(API_ENDPOINTS.REPORTS.TRANSACTION_PDF(id), {
    params,
    responseType: "blob",
  });

  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  return { blob, url };
};

export const fetchTransactionHtml = async (
  id: number | string,
  templateKey?: string
): Promise<string> => {
  const params: Record<string, string> = {};
  if (templateKey) params.templateKey = templateKey;

  const res = await apiClient.get(API_ENDPOINTS.REPORTS.TRANSACTION_HTML(id), {
    params,
    responseType: "text",
  });
  return res.data;
};

export const fetchSampleHtml = async (
  config: Partial<PrintConfigData>
): Promise<string> => {
  const res = await apiClient.post(API_ENDPOINTS.REPORTS.SAMPLE_HTML, config, {
    responseType: "text",
  });
  return res.data;
};

export const fetchSamplePdfBlob = async (
  config: Partial<PrintConfigData>
): Promise<{ blob: Blob; url: string }> => {
  const res = await apiClient.post(API_ENDPOINTS.REPORTS.SAMPLE_PDF, config, {
    responseType: "blob",
  });

  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  return { blob, url };
};

export const printTransactionInvoice = async (
  id: number | string,
  templateKey?: string
): Promise<void> => {
  const { url } = await fetchTransactionPdfBlob(id, templateKey);

  // Hidden iframe technique for seamless direct print
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.top = "-9999px";
  iframe.style.left = "-9999px";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  iframe.src = url;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      // Fallback: open in new tab if iframe printing blocked
      window.open(url, "_blank");
    } finally {
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.URL.revokeObjectURL(url);
      }, 60000);
    }
  };
};

export const downloadInvoicePdf = async (
  _type: string,
  id: number | string,
  fileName?: string
): Promise<void> => {
  const { url } = await fetchTransactionPdfBlob(id);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || `invoice-${id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

export const openInvoicePdfInNewTab = async (
  _type: string,
  id: number | string
): Promise<void> => {
  const { url } = await fetchTransactionPdfBlob(id);
  window.open(url, "_blank");
};
