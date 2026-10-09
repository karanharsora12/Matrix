import React from "react";
import {
  Printer,
  FileDown,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  advanceAmount?: number;
  receivedAmount?: number;
  balanceDue?: number;
  remarks?: string;
  companyInfo?: {
    name?: string;
    address?: string;
    gstin?: string;
    phone?: string;
    email?: string;
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
  billMode = "Cash",
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
  advanceAmount,
  receivedAmount,
  balanceDue,
  remarks,
  companyInfo = {
    name: "MATRIX JEWELLERS & LUXURY RETAIL",
    address: "402, Matrix Heights, CG Road, Navrangpura",
    city: "Ahmedabad, Gujarat - 380009",
    gstin: "24AAACM4901P1Z8",
    phone: "+91 79 2640 9811",
    email: "contact@matrixjewellers.com",
  },
}) => {
  const isPurchase = invoiceType === "purchase";
  const defaultBadgeText = isPurchase ? "PURCHASE INVOICE" : "TAX INVOICE";
  const defaultPartyTitle = isPurchase ? "Purchased From:" : "Billed To:";
  const defaultStaffTitle = isPurchase ? "Purchaser:" : "Salesman:";
  const defaultPartyName = isPurchase ? "Unknown Supplier" : "Walk-in Customer";

  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
  const [isOpeningPdf, setIsOpeningPdf] = React.useState(false);
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

  const displayTitle = badgeText || defaultBadgeText;

  // Calculate taxes assuming equally split CGST and SGST for simplicity (common in India)
  // If actual calculation requires IGST vs CGST/SGST based on state, it would need more props.
  const halfTax = taxAmount / 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[850px] w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 border-0 shadow-2xl rounded-sm print:max-w-none print:w-full print:h-auto print:max-h-none print:shadow-none print:bg-white print:border-none print:p-0 print:m-0 [&>button]:print:hidden">
        {/* Preview UI Header - Hidden when printing */}
        <DialogHeader className="px-5 py-3 border-b border-black bg-slate-50 shrink-0 print:hidden">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-black">
              <Printer className="h-5 w-5" />
              <h2 className="text-base font-semibold">Print Preview</h2>
            </div>
            {statusMessage && (
              <div
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md ${
                  statusMessage.type === "error"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-slate-100 print:bg-white print:overflow-visible">
          {/* A4 Size Container */}
          <div
            id="printable-tax-invoice"
            className="w-[210mm] min-h-[297mm] mx-auto bg-white p-8 sm:my-8 my-0 border border-black print:border-none print:m-0 print:w-full print:h-auto text-black text-sm font-sans"
          >
            {/* Header Section */}
            <div className="flex justify-between items-start pb-4 border-b-2 border-black">
              <div className="flex gap-4">
                
                <div>
                  <h1 className="text-xl font-bold uppercase tracking-wide text-black">
                    {companyInfo.name}
                  </h1>
                  <div className="text-xs text-black mt-1 space-y-0.5">
                    <p>{companyInfo.address}</p>
                    <p>{(companyInfo as any).city}</p>
                    <p>
                      GSTIN:{" "}
                      <span className="font-semibold">{companyInfo.gstin}</span>
                    </p>
                    <p>
                      Phone: {companyInfo.phone} | Email: {companyInfo.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <h2 className="text-xl font-bold uppercase tracking-wider text-black mb-2 border-b-[3px] border-black inline-block pb-1">
                  {displayTitle}
                </h2>
                <div className="text-sm mt-2">
                  <p>
                    <span className="text-black mr-2">Invoice No:</span>
                    <span className="font-semibold">{voucherNo}</span>
                  </p>
                  <p className="mt-1">
                    <span className="text-black mr-2">Invoice Date:</span>
                    <span className="font-semibold">
                      {formatDate(voucherDate)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Customer & Payment Info */}
            <div className="mt-6 flex border border-black">
              {/* BILL TO */}
              <div className="flex-1 p-3 border-r border-black">
                <h3 className="text-xs font-bold text-black uppercase tracking-wider border-b border-black pb-1 mb-2">
                  {partyTitle || defaultPartyTitle}
                </h3>
                <div className="text-sm text-black space-y-1">
                  <p className="font-bold text-base">
                    {party?.name || defaultPartyName}
                  </p>
                  {party?.address && <p>{party.address}</p>}
                  {(party?.city || party?.state) && (
                    <p>
                      {party.city}
                      {party.city && party.state ? ", " : ""}
                      {party.state}
                    </p>
                  )}
                  {party?.phone && <p>Ph: {party.phone}</p>}
                  {party?.gstNo && (
                    <p className="pt-1">
                      GSTIN:{" "}
                      <span className="font-semibold">{party.gstNo}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* PAYMENT DETAILS */}
              <div className="flex-1 p-3">
                <h3 className="text-xs font-bold text-black uppercase tracking-wider border-b border-black pb-1 mb-2">
                  Payment Details
                </h3>
                <div className="grid grid-cols-[100px_1fr] gap-y-1.5 text-sm text-black">
                  <div className="text-black">Mode:</div>
                  <div className="font-semibold">{billMode}</div>

                  <div className="text-black">Rate Type:</div>
                  <div className="font-semibold">{rateFixType}</div>

                  <div className="text-black">Reference:</div>
                  <div className="font-semibold">{reference || "N/A"}</div>

                  <div className="text-black">Terms:</div>
                  <div className="font-semibold">Immediate</div>

                  {staffName && (
                    <>
                      <div className="text-black">
                        {staffTitle || defaultStaffTitle}
                      </div>
                      <div className="font-semibold">{staffName}</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Item Table */}
            <div className="mt-6">
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr>
                    <th className="border border-black px-2 py-2 text-left font-bold w-12">
                      #
                    </th>
                    <th className="border border-black px-2 py-2 text-left font-bold">
                      Item Description
                    </th>
                    <th className="border border-black px-2 py-2 text-left font-bold w-24">
                      Code
                    </th>
                    <th className="border border-black px-2 py-2 text-left font-bold w-20">
                      Purity
                    </th>
                    <th className="border border-black px-2 py-2 text-right font-bold w-24">
                      Net Wt
                    </th>
                    <th className="border border-black px-2 py-2 text-right font-bold w-24">
                      Rate
                    </th>
                    <th className="border border-black px-2 py-2 text-right font-bold w-24">
                      Labour
                    </th>
                    <th className="border border-black px-2 py-2 text-right font-bold w-32">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {itemLines.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="border border-black px-2 py-8 text-center text-black"
                      >
                        No items found
                      </td>
                    </tr>
                  ) : (
                    itemLines.map((line, i) => (
                      <tr key={i}>
                        <td className="border border-black px-2 py-1.5 text-center">
                          {i + 1}
                        </td>
                        <td className="border border-black px-2 py-1.5">
                          {line.itemName || "Item"}
                          {line.tagNo && line.tagNo !== line.itemCode && (
                            <span className="text-black ml-1 text-xs">
                              [{line.tagNo}]
                            </span>
                          )}
                        </td>
                        <td className="border border-black px-2 py-1.5">
                          {line.itemCode || line.tagNo || "-"}
                        </td>
                        <td className="border border-black px-2 py-1.5">
                          {line.purity || "22K"}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-right tabular-nums">
                          {Number(line.netWt || 0).toFixed(3)}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-right tabular-nums">
                          ₹{Number(line.rate || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-right tabular-nums">
                          ₹
                          {Number(line.labourAmount || 0).toLocaleString(
                            "en-IN",
                          )}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-right tabular-nums font-semibold">
                          ₹{Number(line.amount || 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                  {/* Empty rows to fill space if needed, optional */}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="mt-4 flex justify-end">
              <div className="w-72 border border-black">
                <div className="p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="tabular-nums">
                      ₹
                      {subtotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span className="tabular-nums">
                      - ₹
                      {discountAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxable Amount</span>
                    <span className="tabular-nums">
                      ₹
                      {(subtotal - discountAmount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  {halfTax > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>CGST ({(taxRate / 2).toFixed(1)}%)</span>
                        <span className="tabular-nums">
                          ₹
                          {halfTax.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST ({(taxRate / 2).toFixed(1)}%)</span>
                        <span className="tabular-nums">
                          ₹
                          {halfTax.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-b border-black pb-2">
                    <span>Round Off</span>
                    <span className="tabular-nums">
                      ₹
                      {(
                        grandTotal -
                        (subtotal - discountAmount + taxAmount)
                      ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between pt-1 font-bold text-lg text-black">
                    <span>GRAND TOTAL</span>
                    <span className="tabular-nums">
                      ₹
                      {grandTotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {advanceAmount != null && advanceAmount > 0 && (
                    <div className="flex justify-between border-t border-black/20 pt-1 text-xs">
                      <span>Less: Advance Received</span>
                      <span className="tabular-nums">
                        - ₹
                        {advanceAmount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  {receivedAmount != null && receivedAmount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span>Less: Payment Received</span>
                      <span className="tabular-nums">
                        - ₹
                        {receivedAmount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}

                  {balanceDue != null && (
                    <div className="flex justify-between border-t border-black pt-1 font-bold text-sm">
                      <span>Balance Due</span>
                      <span className="tabular-nums">
                        ₹
                        {balanceDue.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Amount formatted */}
            <div className="mt-6 border-t border-black pt-3">
              <p className="text-sm">
                <span className="font-bold mr-2">Amount:</span>
                <span className="font-semibold">
                  ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </p>
            </div>

            {/* Remarks and Terms */}
            <div className="mt-6 text-sm">
              <p className="font-bold mb-1">Remarks:</p>
              <p className="text-black min-h-[40px] border-b border-dotted border-black">
                {remarks || ""}
              </p>

              <div className="mt-4">
                <p className="font-bold mb-1">Terms & Conditions:</p>
                <ol className="list-decimal list-inside text-xs text-black space-y-1">
                  <li>
                    Goods/services once sold will be subject to company terms.
                  </li>
                  <li>
                    Payment should be made according to agreed payment terms.
                  </li>
                  <li>Any dispute is subject to applicable jurisdiction.</li>
                </ol>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-16 flex justify-between px-8 text-sm">
              <div className="text-center">
                <div className="w-48 border-b border-black mb-2"></div>
                <p className="font-bold">Customer Signature</p>
              </div>
              <div className="text-center">
                <div className="w-48 border-b border-black mb-2"></div>
                <p className="font-bold">Authorized Signatory</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-4 border-t border-black flex justify-between text-xs text-black">
              <p>Thank you for your business.</p>
              <p>Page 1 of 1</p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Hidden when printing */}
        <DialogFooter className="px-5 py-3 border-t border-black bg-slate-50 shrink-0 sm:justify-end gap-2 print:hidden">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-black"
          >
            Close
          </Button>
          {voucherId && (
            <>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleOpenPdf}
                disabled={isOpeningPdf || isDownloadingPdf}
              >
                <ExternalLink className="h-4 w-4" />
                View PDF
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleDownloadPdf}
                disabled={isOpeningPdf || isDownloadingPdf}
              >
                <FileDown className="h-4 w-4" />
                Download PDF
              </Button>
            </>
          )}
          <Button
            className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrintInvoiceModal;
