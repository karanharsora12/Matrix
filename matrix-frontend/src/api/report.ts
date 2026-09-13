import apiClient from "./client";

export const REPORT_ENDPOINTS = {
  SALES_INVOICE: (id: number | string) => `/reports/sales-invoice/${id}`,
  PURCHASE_INVOICE: (id: number | string) => `/reports/purchase-invoice/${id}`,
};

export const downloadInvoicePdf = async (
  type: "sales" | "purchase",
  id: number | string,
  fileName?: string,
) => {
  const endpoint =
    type === "purchase"
      ? REPORT_ENDPOINTS.PURCHASE_INVOICE(id)
      : REPORT_ENDPOINTS.SALES_INVOICE(id);

  try {
    const response = await apiClient.get(endpoint, {
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "application/pdf" });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName || `${type}-invoice-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Failed to download PDF invoice:", error);
    throw error;
  }
};

export const openInvoicePdfInNewTab = async (
  type: "sales" | "purchase",
  id: number | string,
) => {
  const endpoint =
    type === "purchase"
      ? REPORT_ENDPOINTS.PURCHASE_INVOICE(id)
      : REPORT_ENDPOINTS.SALES_INVOICE(id);

  try {
    const response = await apiClient.get(endpoint, {
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "application/pdf" });
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
  } catch (error) {
    console.error("Failed to open PDF invoice:", error);
    throw error;
  }
};
