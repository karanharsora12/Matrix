import apiClient from "./client";
import { API_ENDPOINTS } from "@/config/apiEndpoints";

export interface PlaceholderInfo {
  key: string;
  label: string;
  example: string;
}

export interface EmailTemplateData {
  id?: number;
  templateKey: string;
  templateName: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
  senderName?: string | null;
  replyTo?: string | null;
  cc?: string | null;
  bcc?: string | null;
  attachPdf?: boolean;
  pdfTemplateKey?: string | null;
  availablePlaceholders?: string | null;
  isActive?: boolean;
  updatedAt?: string;
  createdAt?: string;
}

export interface EmailPreviewData {
  templateKey: string;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
  attachPdf: boolean;
  samplePlaceholders?: Record<string, any>;
  availablePlaceholders?: PlaceholderInfo[];
}

export interface SendEmailPayload {
  transactionId: number;
  transactionType?: string;
  templateKey?: string;
  recipientEmail: string;
  subject?: string;
  bodyHtml?: string;
  attachPdf?: boolean;
}

export interface SendEmailResponse {
  success: boolean;
  logId?: number;
  message: string;
  recipientEmail: string;
  status: "sent" | "failed";
}

export interface EmailLogEntry {
  id: number;
  transactionId?: number | null;
  transactionType?: string | null;
  templateKey?: string | null;
  recipientEmail: string;
  subject: string;
  bodyHtml?: string | null;
  pdfAttached?: boolean | null;
  status: string;
  errorMessage?: string | null;
  sentAt?: string;
  createdAt?: string;
}

export const fetchEmailTemplates = async (): Promise<EmailTemplateData[]> => {
  const res = await apiClient.get(API_ENDPOINTS.EMAIL_TEMPLATES.BASE);
  return res.data.data;
};

export const fetchEmailTemplate = async (
  templateKey: string
): Promise<EmailTemplateData> => {
  const res = await apiClient.get(
    API_ENDPOINTS.EMAIL_TEMPLATES.BY_KEY(templateKey)
  );
  return res.data.data;
};

export const saveEmailTemplate = async (
  template: EmailTemplateData
): Promise<EmailTemplateData> => {
  const res = await apiClient.post(
    API_ENDPOINTS.EMAIL_TEMPLATES.BASE,
    template
  );
  return res.data.data;
};

export const resetEmailTemplate = async (
  templateKey: string
): Promise<EmailTemplateData> => {
  const res = await apiClient.post(
    API_ENDPOINTS.EMAIL_TEMPLATES.RESET(templateKey)
  );
  return res.data.data;
};

export const fetchTransactionEmailPreview = async (
  templateKey: string,
  transactionId: number | string
): Promise<EmailPreviewData> => {
  const res = await apiClient.get(
    API_ENDPOINTS.EMAIL_TEMPLATES.PREVIEW(templateKey, transactionId)
  );
  return res.data.data;
};

export const sendTransactionEmail = async (
  payload: SendEmailPayload
): Promise<SendEmailResponse> => {
  const res = await apiClient.post(
    API_ENDPOINTS.EMAIL_TEMPLATES.SEND,
    payload
  );
  return res.data.data;
};

export const fetchTransactionEmailLogs = async (
  transactionId: number | string
): Promise<EmailLogEntry[]> => {
  const res = await apiClient.get(
    API_ENDPOINTS.EMAIL_TEMPLATES.LOGS(transactionId)
  );
  return res.data.data;
};
