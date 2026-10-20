import React, { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Clock,
  History,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  fetchTransactionEmailPreview,
  sendTransactionEmail,
  fetchTransactionEmailLogs,
} from "@/api/email";
import type { EmailLogEntry, EmailPreviewData } from "@/api/email";

export interface SendEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: number | string;
  transactionType?: string;
  templateKey?: string;
  voucherNo?: string;
  defaultEmail?: string;
  onSuccess?: () => void;
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  open,
  onOpenChange,
  transactionId,
  transactionType = "repairing-bill",
  templateKey = "repairing-bill",
  voucherNo,
  defaultEmail = "",
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<"compose" | "preview" | "history">("compose");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [attachPdf, setAttachPdf] = useState(true);

  // Email Logs
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Load email preview & defaults whenever modal opens
  useEffect(() => {
    if (!open || !transactionId) return;

    let isSubscribed = true;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setActiveTab("compose");

    fetchTransactionEmailPreview(templateKey, transactionId)
      .then((preview: EmailPreviewData) => {
        if (!isSubscribed) return;
        setRecipientEmail(preview.recipientEmail || defaultEmail || "");
        setSubject(preview.subject || "");
        setBodyHtml(preview.bodyHtml || "");
        setAttachPdf(preview.attachPdf ?? true);
        setLoading(false);
      })
      .catch((err: any) => {
        if (!isSubscribed) return;
        console.error("Failed to load email preview:", err);
        setError(
          err?.response?.data?.error ||
            err.message ||
            "Failed to load transaction email template"
        );
        setLoading(false);
      });

    // Also fetch sent logs for this transaction
    fetchTransactionEmailLogs(transactionId)
      .then((logEntries) => {
        if (isSubscribed) {
          setLogs(logEntries || []);
        }
      })
      .catch(() => {
        // Silently catch logs load error
      });

    return () => {
      isSubscribed = false;
    };
  }, [open, transactionId, templateKey, defaultEmail]);

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.trim()) {
      setError("Please provide a valid recipient email address.");
      return;
    }

    if (!recipientEmail.includes("@") || !recipientEmail.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    setSending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await sendTransactionEmail({
        transactionId: Number(transactionId),
        transactionType,
        templateKey,
        recipientEmail: recipientEmail.trim(),
        subject,
        bodyHtml,
        attachPdf,
      });

      setSuccessMessage(
        res.message || `Invoice email successfully sent to ${recipientEmail}!`
      );

      // Refresh logs
      fetchTransactionEmailLogs(transactionId).then((newLogs) => {
        setLogs(newLogs || []);
      });

      if (onSuccess) {
        onSuccess();
      }

      // Automatically close or keep open to view confirmation
      setTimeout(() => {
        // Leave message visible for a moment
      }, 2500);
    } catch (err: any) {
      console.error("Failed to dispatch email:", err);
      setError(
        err?.response?.data?.error ||
          err.message ||
          "Failed to dispatch transaction email"
      );
    } finally {
      setSending(false);
    }
  };

  const handleReloadLogs = async () => {
    setLoadingLogs(true);
    try {
      const refreshed = await fetchTransactionEmailLogs(transactionId);
      setLogs(refreshed || []);
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={voucherNo ? `Send Email — ${voucherNo}` : "Send Transaction Email"}
      description="Send digital invoice and itemized summary to customer's email inbox"
      width="2xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {logs.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Sent {logs.length} time{logs.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSendEmail}
              disabled={loading || sending || !recipientEmail}
              className="gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90"
            >
              {sending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sending Email...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Email</span>
                </>
              )}
            </Button>
          </div>
        </div>
      }
    >
      {/* Tab Navigation */}
      <div className="flex border-b text-xs font-medium text-muted-foreground -mt-1 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("compose")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition-colors ${
            activeTab === "compose"
              ? "border-primary text-primary font-semibold"
              : "border-transparent hover:text-foreground"
          }`}
        >
          <Mail className="h-3.5 w-3.5" />
          Compose & Send
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition-colors ${
            activeTab === "preview"
              ? "border-primary text-primary font-semibold"
              : "border-transparent hover:text-foreground"
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          Preview Body
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition-colors ${
            activeTab === "history"
              ? "border-primary text-primary font-semibold"
              : "border-transparent hover:text-foreground"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          Email Logs {logs.length > 0 && `(${logs.length})`}
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="flex h-56 flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Preparing transaction email preview...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Success Banner */}
          {successMessage && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: COMPOSE */}
          {activeTab === "compose" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="recipientEmail" className="text-xs font-semibold">
                  Recipient Customer Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. customer@example.com"
                  className="text-xs font-medium"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="emailSubject" className="text-xs font-semibold">
                  Email Subject
                </Label>
                <Input
                  id="emailSubject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line"
                  className="text-xs"
                />
              </div>

              {/* PDF Attachment Banner */}
              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="attachPdfModal"
                      checked={attachPdf}
                      onChange={(e) => setAttachPdf(e.target.checked)}
                    />
                    <Label
                      htmlFor="attachPdfModal"
                      className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1.5"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-primary" />
                      Attach PDF Invoice
                    </Label>
                  </div>
                  {attachPdf && (
                    <span className="font-mono text-[11px] text-muted-foreground bg-background px-2 py-0.5 rounded border">
                      Invoice-{voucherNo || transactionId}.pdf
                    </span>
                  )}
                </div>
              </div>

              {/* Quick snippet overview */}
              <div className="flex items-center justify-between rounded-md border border-dashed p-2.5 text-[11px] text-muted-foreground bg-background">
                <span>Body Content: Formatted HTML with transaction breakdown</span>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className="text-primary hover:underline font-semibold flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" /> View Email Body Preview
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PREVIEW */}
          {activeTab === "preview" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Rendered Customer Email Output</span>
                <span className="text-[11px]">Formatted with customer and items data</span>
              </div>
              <div className="flex justify-center w-full rounded-lg border bg-zinc-100 dark:bg-zinc-950/80 p-2 overflow-hidden">
                <iframe
                  srcDoc={bodyHtml}
                  title="Transaction Email Preview"
                  className="w-full border-0 rounded shadow-xs"
                  style={{
                    height: "380px",
                    maxWidth: "620px",
                    backgroundColor: "#f8fafc",
                  }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}

          {/* TAB 3: LOGS & HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  Dispatch History for this Invoice
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReloadLogs}
                  disabled={loadingLogs}
                  className="h-6 gap-1 text-[11px]"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingLogs ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {logs.length === 0 ? (
                <div className="flex h-36 flex-col items-center justify-center gap-1 text-center text-muted-foreground">
                  <Mail className="h-6 w-6 text-muted-foreground/50" />
                  <p className="text-xs">No emails have been sent for this invoice yet.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[320px] overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between rounded-md border bg-background p-2.5 text-xs shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {log.recipientEmail}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-semibold uppercase ${
                              log.status === "sent"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate max-w-sm">
                          {log.subject}
                        </p>
                      </div>

                      <div className="text-right text-[10px] text-muted-foreground shrink-0 pl-2">
                        <div className="flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" />
                          <span>
                            {log.sentAt
                              ? new Date(log.sentAt).toLocaleString()
                              : log.createdAt
                              ? new Date(log.createdAt).toLocaleString()
                              : "Just now"}
                          </span>
                        </div>
                        {log.pdfAttached && (
                          <span className="text-primary font-medium">PDF Attached</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
