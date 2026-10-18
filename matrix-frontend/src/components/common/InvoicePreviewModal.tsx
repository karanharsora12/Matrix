import React, { useEffect, useState, useRef } from "react";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Download,
  Loader2,
  RefreshCw,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileCheck,
} from "lucide-react";
import {
  fetchTransactionHtml,
  downloadInvoicePdf,
  printTransactionInvoice,
  fetchAllPrintConfigs,
} from "@/api/report";
import type { PrintConfigData } from "@/api/report";

export interface InvoicePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId?: number | string | null;
  transactionType?: string;
  voucherNo?: string;
  onClose?: () => void;
}

/**
 * Isolated Shadow DOM Invoice Renderer:
 * Prevents iframe delays, eliminating layout shifts and height jumping.
 * Completely isolates Handlebars invoice CSS from ERP application styles.
 */
const InvoicePaperShadowHost: React.FC<{ html: string }> = ({ html }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    if (!shadowRootRef.current) {
      shadowRootRef.current = hostRef.current.attachShadow({ mode: "open" });
    }
    shadowRootRef.current.innerHTML = html;
  }, [html]);

  return <div ref={hostRef} className="w-full overflow-hidden" />;
};

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  open,
  onOpenChange,
  transactionId,
  transactionType = "repairing-bill",
  voucherNo,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<PrintConfigData[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>("default");
  const [zoom, setZoom] = useState<number>(100);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Load available templates for this transaction type
  useEffect(() => {
    if (!open) return;
    fetchAllPrintConfigs(transactionType)
      .then((configs) => {
        if (configs && configs.length > 0) {
          setTemplates(configs);
          const defaultTpl = configs.find((c) => c.isDefault);
          if (defaultTpl?.templateKey) {
            setSelectedTemplateKey(defaultTpl.templateKey);
          }
        }
      })
      .catch((err) => {
        console.warn("Could not load templates:", err);
      });
  }, [open, transactionType]);

  // Load Invoice HTML when transactionId or selectedTemplateKey changes
  useEffect(() => {
    if (!open || !transactionId) {
      setHtmlContent(null);
      return;
    }

    let isSubscribed = true;
    setLoading(true);
    setError(null);

    fetchTransactionHtml(transactionId, selectedTemplateKey)
      .then((html) => {
        if (isSubscribed) {
          setHtmlContent(html);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isSubscribed) {
          console.error("Failed to load invoice HTML:", err);
          setError(
            err?.response?.data?.message ||
              err.message ||
              "Failed to render invoice preview",
          );
          setLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [open, transactionId, selectedTemplateKey]);

  const handlePrint = async () => {
    if (!transactionId || isPrinting) return;
    setIsPrinting(true);
    try {
      await printTransactionInvoice(transactionId, selectedTemplateKey);
    } catch (err: any) {
      console.warn("Print invoice fallback error:", err);
      // Fallback: system print
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = async () => {
    if (!transactionId || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadInvoicePdf(
        transactionType,
        transactionId,
        `Invoice-${voucherNo || transactionId}.pdf`,
      );
    } catch (err) {
      console.error("Failed to download PDF:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 15, 145));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 15, 65));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const handleModalClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen && onClose) {
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleModalClose}
      title={voucherNo ? `Invoice Preview — ${voucherNo}` : "Invoice Preview"}
      description="Document layout preview. Check items, valuation, and print."
      width="3xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            <span className="font-medium text-foreground">A4 Tax Invoice Sheet</span>
            <span className="text-zinc-400">·</span>
            <span>Original for Recipient</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Stable Download Button with fixed width */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!htmlContent || loading || isDownloading}
              className="h-8 w-[138px] justify-center gap-1.5 text-xs font-medium rounded-lg border-zinc-300 dark:border-zinc-700 hover:bg-muted active:scale-[0.98] transition-all"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-primary" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  <span>Download PDF</span>
                </>
              )}
            </Button>

            {/* Stable Primary Print Button with fixed width */}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handlePrint}
              disabled={!htmlContent || loading || isPrinting}
              className="h-8 w-[132px] justify-center gap-1.5 bg-primary-action text-primary-action-foreground text-xs font-semibold rounded-lg shadow-sm hover:bg-primary-action/90 active:scale-[0.98] transition-all"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  <span>Printing...</span>
                </>
              ) : (
                <>
                  <Printer className="h-3.5 w-3.5 shrink-0" />
                  <span>Print Invoice</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleModalClose(false)}
              className="h-8 w-[72px] justify-center text-xs rounded-lg active:scale-[0.98] transition-all"
            >
              Close
            </Button>
          </div>
        </div>
      }
    >
      {/* Top Document Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-1.5 rounded-t-md -mt-1 mb-3">
        <div className="flex items-center gap-2">
          {templates.length > 1 ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Template:</span>
              <select
                value={selectedTemplateKey}
                onChange={(e) => setSelectedTemplateKey(e.target.value)}
                className="rounded-md border border-input bg-background px-2 py-0.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {templates.map((t) => (
                  <option key={t.id || t.templateKey} value={t.templateKey}>
                    {t.templateName || t.templateKey}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Standard Template (Repairing Bill)</span>
            </div>
          )}
        </div>

        {/* Stable Zoom Controls Toolbar */}
        <div className="flex items-center gap-1 rounded-md border border-input bg-background p-0.5 shadow-2xs">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleZoomOut}
            disabled={zoom <= 65}
            title="Zoom Out"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="w-10 text-center font-mono text-[11px] font-semibold text-muted-foreground">
            {zoom}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleZoomIn}
            disabled={zoom >= 145}
            title="Zoom In"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          {zoom !== 100 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={handleResetZoom}
              title="Reset Zoom to 100%"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Viewport Canvas Desk with stable minimum height preventing any layout jitter */}
      <div className="relative flex min-h-[500px] max-h-[68vh] w-full flex-col items-center justify-start overflow-y-auto overflow-x-hidden rounded-lg bg-zinc-100 p-4 sm:p-6 dark:bg-zinc-950/80 border border-border">
        {/* Stable Skeleton Loader with Exact Paper Dimensions */}
        {loading && (
          <div className="flex flex-col items-center justify-center w-full max-w-[680px] min-h-[460px] rounded-md bg-white p-8 shadow-sm border border-zinc-200 dark:border-zinc-800 my-auto animate-pulse">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-foreground">
                  Rendering Document Preview
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Formatting invoice with authoritative transaction data...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="my-auto flex max-w-md flex-col items-center justify-center p-6 text-center gap-3 bg-background rounded-lg border border-border shadow-xs">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h4 className="font-semibold text-foreground">
              Preview Generation Failed
            </h4>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedTemplateKey((k) => k)}
              className="mt-2 text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Generating
            </Button>
          </div>
        )}

        {/* Instant Native Paper Preview via Isolated Shadow DOM (No iframe delay or jitter) */}
        {htmlContent && !error && !loading && (
          <div
            className="flex flex-col items-center w-full transition-transform duration-150 ease-out"
            style={{
              transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
              transformOrigin: "top center",
            }}
          >
            <div className="w-full max-w-[700px] rounded-md bg-white p-5 sm:p-7 shadow-xl border border-zinc-200 dark:border-zinc-800 text-zinc-900 transition-all">
              <InvoicePaperShadowHost html={htmlContent} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
