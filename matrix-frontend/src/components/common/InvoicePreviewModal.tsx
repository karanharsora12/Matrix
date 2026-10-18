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
  const [iframeHeight, setIframeHeight] = useState<string>("850px");
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  // Handle iframe content resize
  const handleIframeLoad = () => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc?.body) {
        doc.body.style.margin = "0";
        doc.body.style.padding = "0";
        doc.body.style.background = "transparent";
        const scrollH = Math.max(
          doc.body.scrollHeight,
          doc.documentElement.scrollHeight,
          650,
        );
        setIframeHeight(`${scrollH + 20}px`);
      }
    } catch {
      setIframeHeight("900px");
    }
  };

  const handlePrint = async () => {
    if (!transactionId) return;
    setIsPrinting(true);
    try {
      await printTransactionInvoice(transactionId, selectedTemplateKey);
    } catch (err: any) {
      console.warn("Print invoice fallback error:", err);
      // Fallback: try printing the preview iframe directly
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
      }
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = async () => {
    if (!transactionId) return;
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
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Template selector & Zoom controls */}
          <div className="flex items-center gap-2">
            {templates.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Template:</span>
                <select
                  value={selectedTemplateKey}
                  onChange={(e) => setSelectedTemplateKey(e.target.value)}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {templates.map((t) => (
                    <option key={t.id || t.templateKey} value={t.templateKey}>
                      {t.templateName || t.templateKey}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Zoom Controls Toolbar */}
            <div className="flex items-center gap-1 rounded-md border border-input bg-background p-0.5">
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

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!htmlContent || loading || isDownloading}
              className="h-8 gap-1.5 text-xs"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Download PDF
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handlePrint}
              disabled={!htmlContent || loading || isPrinting}
              className="h-8 gap-1.5 bg-primary-action text-primary-action-foreground text-xs font-semibold hover:bg-primary-action/90"
            >
              {isPrinting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Printer className="h-3.5 w-3.5" />
              )}
              Print Invoice
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleModalClose(false)}
              className="h-8 text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      }
    >
      {/* Viewport Canvas Desk */}
      <div className="relative flex min-h-[460px] max-h-[70vh] w-full flex-col items-center justify-start overflow-y-auto overflow-x-hidden rounded-lg bg-zinc-100 p-4 sm:p-6 dark:bg-zinc-950/80 border border-border">
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Rendering invoice preview...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="my-auto flex max-w-md flex-col items-center justify-center p-6 text-center gap-3">
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

        {/* Paper Sheet Preview Container (A4 / Document Page styling) */}
        {htmlContent && !error && (
          <div
            className="flex flex-col items-center w-full transition-transform duration-150 ease-out"
            style={{
              transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
              transformOrigin: "top center",
            }}
          >
            <div className="w-full max-w-[700px] rounded-md bg-white p-5 sm:p-7 shadow-xl border border-zinc-200 dark:border-zinc-800 text-zinc-900">
              {/* Paper header badge */}
              <div className="mb-2 flex items-center justify-between border-b border-zinc-100 pb-1.5 text-[10px] text-zinc-400 select-none">
                <span className="flex items-center gap-1 font-medium">
                  <FileCheck className="h-3 w-3 text-emerald-600" />
                  Standard Tax Invoice Sheet
                </span>
                <span>Matrix ERP Print System</span>
              </div>

              {/* Seamless, unstyled iframe rendering pure HTML without browser PDF toolbars */}
              <iframe
                ref={iframeRef}
                srcDoc={htmlContent}
                title="Invoice Document Preview"
                scrolling="no"
                onLoad={handleIframeLoad}
                className="w-full border-none overflow-hidden"
                style={{
                  height: iframeHeight,
                  background: "transparent",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
