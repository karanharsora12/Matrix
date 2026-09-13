import React from "react";
import {
  Printer,
  FileDown,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/date";
import { downloadInvoicePdf, openInvoicePdfInNewTab } from "@/api/report";

export interface InvoicePartyInfo {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  gstNo?: string;
  panNo?: string;
}

export interface InvoiceLineItem {
  itemName?: string;
  itemCode?: string;
  tagNo?: string;
  purity?: string;
  grossWt?: number | string;
  netWt?: number | string;
  rate?: number | string;
  labourAmount?: number | string;
  discountAmount?: number | string;
  amount?: number | string;
}

export interface PrintInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceType?: "sales" | "purchase" | string;
  voucherId?: number | string;
  badgeText?: string;
  voucherNo?: string;
  voucherDate?: string | Date;
  partyTitle?: string;
  party?: InvoicePartyInfo;
  billMode?: string;
  staffTitle?: string;
  staffName?: string;
  reference?: string;
  rateFixType?: string;
  itemLines?: InvoiceLineItem[];
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  taxRate?: number;
  grandTotal?: number;
  remarks?: string;
  companyInfo?: {
    name?: string;
    address?: string;
    gstin?: string;
    phone?: string;
  };
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  open,
  onOpenChange,
  invoiceType = "sales",
  voucherId,
  badgeText,
  voucherNo = "INV-001",
  voucherDate,
  partyTitle,
  party,
  billMode = "Debit Memo",
  staffTitle,
  staffName,
  reference,
  rateFixType = "Fix",
  itemLines = [],
  subtotal = 0,
  discountAmount = 0,
  taxAmount = 0,
  taxRate = 3,
  grandTotal = 0,
  remarks,
  companyInfo = {
    name: "MATRIX JEWELLERS & LUXURY RETAIL",
    address: "402, Matrix Heights, CG Road, Navrangpura, Ahmedabad - 380009",
    gstin: "24AAACM4901P1Z8",
    phone: "+91 79 2640 9811",
  },
}) => {
  const isPurchase = invoiceType === "purchase";
  const defaultBadgeText = isPurchase
    ? "PURCHASE TAX INVOICE"
    : "RETAIL TAX INVOICE";
  const defaultPartyTitle = isPurchase ? "Purchased From:" : "Billed To:";
  const defaultStaffTitle = isPurchase ? "Purchaser:" : "Salesman:";
  const defaultPartyName = isPurchase ? "Unknown Supplier" : "Walk-in Customer";

  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
  const [isOpeningPdf, setIsOpeningPdf] = React.useState(false);
  const [showRemarks, setShowRemarks] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const handleDownloadPdf = async () => {
    setStatusMessage(null);
    if (!voucherId) {
      setStatusMessage({
        text: "Please save this voucher first to download the PDF invoice.",
        type: "error",
      });
      return;
    }
    try {
      setIsDownloadingPdf(true);
      await downloadInvoicePdf(
        isPurchase ? "purchase" : "sales",
        voucherId,
        `${isPurchase ? "Purchase" : "Sales"}-Invoice-${voucherNo}.pdf`,
      );
      setStatusMessage({
        text: "Invoice PDF downloaded successfully.",
        type: "success",
      });
    } catch (err: any) {
      setStatusMessage({
        text: err?.message || "Failed to download PDF invoice.",
        type: "error",
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleOpenPdf = async () => {
    setStatusMessage(null);
    if (!voucherId) {
      setStatusMessage({
        text: "Please save this voucher first to open the PDF invoice.",
        type: "error",
      });
      return;
    }
    try {
      setIsOpeningPdf(true);
      await openInvoicePdfInNewTab(
        isPurchase ? "purchase" : "sales",
        voucherId,
      );
    } catch (err: any) {
      setStatusMessage({
        text: err?.message || "Failed to open PDF invoice.",
        type: "error",
      });
    } finally {
      setIsOpeningPdf(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl border-0 shadow-2xl">
        {/* ── Compact Header ── */}
        <DialogHeader className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 border border-amber-200">
                <Printer className="h-4 w-4 text-amber-700" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Invoice Preview
                </h2>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono px-2 py-0.5"
                >
                  {voucherNo}
                </Badge>
                <Badge className="text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5">
                  {badgeText || defaultBadgeText}
                </Badge>
              </div>
            </div>
            {/* Status */}
            {statusMessage && (
              <div
                className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg ${
                  statusMessage.type === "error"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 shrink-0" />
                )}
                <span className="font-medium">{statusMessage.text}</span>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* ── Printable Invoice Container ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          <div
            id="printable-tax-invoice"
            className="mx-auto border border-slate-200 rounded-xl bg-white text-slate-900 shadow-sm overflow-hidden"
          >
            {/* ── Company Header (Compact) ── */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 px-6 py-4 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
              <div className="relative flex justify-between items-start">
                <div>
                  <h1 className="text-lg font-black tracking-tight leading-tight">
                    {companyInfo.name}
                  </h1>
                  <p className="text-amber-100 text-[10px] mt-1 max-w-md leading-relaxed">
                    {companyInfo.address}
                  </p>
                  <p className="text-[10px] text-amber-100 mt-1">
                    GSTIN: {companyInfo.gstin} • {companyInfo.phone}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-md px-2 py-1 border border-white/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {badgeText || defaultBadgeText}
                    </span>
                  </div>
                  <p className="text-sm font-black mt-1.5">#{voucherNo}</p>
                  <p className="text-amber-100 text-[10px]">
                    {formatDate(voucherDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Party Info & Terms (Side by Side - Compact) ── */}
            <div className="px-6 py-3 grid grid-cols-2 gap-4 border-b border-slate-100 bg-slate-50/50">
              {/* Party */}
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  {partyTitle || defaultPartyTitle}
                </p>
                <div className="bg-white rounded-lg p-2.5 border border-slate-100">
                  <p className="font-bold text-xs text-slate-900 truncate">
                    {party?.name || defaultPartyName}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                    {party?.phone && <span>Ph: {party.phone}</span>}
                    {party?.city && <span>• {party.city}</span>}
                    {party?.state && <span>, {party.state}</span>}
                  </div>
                  {(party?.gstNo || party?.panNo) && (
                    <div className="flex gap-3 mt-1 pt-1 border-t border-slate-50 text-[9px] text-slate-400">
                      {party?.gstNo && (
                        <span>
                          GSTIN: <b className="text-slate-600">{party.gstNo}</b>
                        </span>
                      )}
                      {party?.panNo && (
                        <span>
                          PAN: <b className="text-slate-600">{party.panNo}</b>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Terms */}
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                  Payment & Terms
                </p>
                <div className="bg-white rounded-lg p-2.5 border border-slate-100 grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Mode</span>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-semibold h-4 px-1.5"
                    >
                      {billMode}
                    </Badge>
                  </div>
                  {staffName && (
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">
                        {staffTitle || defaultStaffTitle}
                      </span>
                      <span className="font-semibold text-slate-700">
                        {staffName}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Reference</span>
                    <span className="font-semibold text-slate-700">
                      {reference || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Rate Type</span>
                    <span className="font-semibold text-slate-700">
                      {rateFixType}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Items Table (Dense) ── */}
            <div className="px-6 py-2">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-1.5 px-1.5 text-left font-bold text-slate-400 uppercase tracking-wider w-6">
                      #
                    </th>
                    <th className="py-1.5 px-1.5 text-left font-bold text-slate-400 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="py-1.5 px-1.5 text-left font-bold text-slate-400 uppercase tracking-wider w-16">
                      Code
                    </th>
                    <th className="py-1.5 px-1.5 text-left font-bold text-slate-400 uppercase tracking-wider w-12">
                      Purity
                    </th>
                    <th className="py-1.5 px-1.5 text-right font-bold text-slate-400 uppercase tracking-wider w-16">
                      Net Wt
                    </th>
                    <th className="py-1.5 px-1.5 text-right font-bold text-slate-400 uppercase tracking-wider w-16">
                      Rate
                    </th>
                    <th className="py-1.5 px-1.5 text-right font-bold text-slate-400 uppercase tracking-wider w-16">
                      Labour
                    </th>
                    <th className="py-1.5 px-1.5 text-right font-bold text-slate-400 uppercase tracking-wider w-20">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {itemLines.map((line, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-50 last:border-0 hover:bg-amber-50/30"
                    >
                      <td className="py-1.5 px-1.5 text-slate-300 font-medium">
                        {i + 1}
                      </td>
                      <td className="py-1.5 px-1.5">
                        <span className="font-semibold text-slate-800">
                          {line.itemName || "Item"}
                        </span>
                        {line.tagNo && line.tagNo !== line.itemCode && (
                          <span className="text-[8px] text-slate-400 ml-1">
                            [{line.tagNo}]
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-1.5 text-slate-500 font-mono">
                        {line.itemCode || line.tagNo || "-"}
                      </td>
                      <td className="py-1.5 px-1.5">
                        <span className="inline-flex px-1 py-0.5 rounded bg-amber-100 text-amber-700 text-[8px] font-bold">
                          {line.purity || "22K"}
                        </span>
                      </td>
                      <td className="py-1.5 px-1.5 text-right font-medium text-slate-700 tabular-nums">
                        {Number(line.netWt || 0).toFixed(3)}g
                      </td>
                      <td className="py-1.5 px-1.5 text-right text-slate-600 tabular-nums">
                        ₹{Number(line.rate || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-1.5 px-1.5 text-right text-slate-600 tabular-nums">
                        ₹
                        {Number(line.labourAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-1.5 px-1.5 text-right font-bold text-slate-900 tabular-nums">
                        ₹{Number(line.amount || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Remarks (Collapsible) & Totals ── */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
              <div className="flex gap-4 items-start">
                {/* Remarks - Collapsible */}
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => setShowRemarks(!showRemarks)}
                    className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 hover:text-slate-600 transition-colors"
                  >
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${showRemarks ? "rotate-180" : ""}`}
                    />
                    Remarks / Terms
                  </button>
                  {showRemarks && (
                    <div className="bg-white rounded-lg p-2 border border-slate-100 text-[10px] text-slate-600 leading-relaxed mt-1">
                      {remarks ||
                        "All jewellery items are BIS Hallmarked. 100% Certified."}
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="w-56 shrink-0">
                  <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
                    <div className="p-2.5 space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Subtotal</span>
                        <span className="font-semibold text-slate-700 tabular-nums">
                          ₹
                          {subtotal.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-[10px]">
                          <span className="text-rose-500">Discount</span>
                          <span className="font-semibold text-rose-600 tabular-nums">
                            -₹
                            {discountAmount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">GST ({taxRate}%)</span>
                        <span className="font-semibold text-slate-700 tabular-nums">
                          ₹
                          {taxAmount.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 bg-gradient-to-r from-amber-50 to-amber-100/50 px-2.5 py-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-900">
                          Grand Total
                        </span>
                        <span className="text-sm font-black text-amber-700 tabular-nums">
                          ₹
                          {grandTotal.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <DialogFooter className="px-5 py-3 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white shrink-0 gap-2 sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 border-slate-200 hover:bg-slate-100 text-slate-700 text-xs"
          >
            Close
          </Button>

          {voucherId && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50 text-xs"
                onClick={handleOpenPdf}
                disabled={isOpeningPdf || isDownloadingPdf}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View PDF
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50 text-xs"
                onClick={handleDownloadPdf}
                disabled={isOpeningPdf || isDownloadingPdf}
              >
                <FileDown className="h-3.5 w-3.5" />
                Download
              </Button>
            </>
          )}

          <Button
            size="sm"
            className="h-8 gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md shadow-amber-200 text-xs"
            onClick={() => window.print()}
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="font-semibold">Print</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrintInvoiceModal;
