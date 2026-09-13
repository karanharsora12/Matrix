import React from "react";
import { Printer } from "lucide-react";
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

export interface InvoicePartyInfo {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
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
  const defaultBadgeText = isPurchase ? "PURCHASE TAX INVOICE" : "RETAIL TAX INVOICE";
  const defaultPartyTitle = isPurchase ? "Purchased From:" : "Billed To:";
  const defaultStaffTitle = isPurchase ? "Purchaser:" : "Salesman:";
  const defaultPartyName = isPurchase ? "Unknown Supplier" : "Walk-in Customer";

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-base">
            <span>Tax Invoice Preview</span>
            <Badge variant="outline" className="text-xs">
              {voucherNo}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Printable Invoice Container */}
        <div
          id="printable-tax-invoice"
          className="border border-slate-200 p-6 rounded-lg bg-white text-slate-900 space-y-4"
        >
          {/* Company Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-black tracking-tight text-amber-700">
                {companyInfo.name}
              </h2>
              <p className="text-xs text-slate-600">{companyInfo.address}</p>
              <p className="text-xs text-slate-600">
                GSTIN: {companyInfo.gstin} &bull; Phone: {companyInfo.phone}
              </p>
            </div>
            <div className="text-right">
              <Badge className="bg-amber-600 text-white font-bold">
                {badgeText || defaultBadgeText}
              </Badge>
              <p className="mt-1 text-xs font-bold">Invoice #{voucherNo}</p>
              <p className="text-xs text-slate-500">
                Date: {formatDate(voucherDate)}
              </p>
            </div>
          </div>

          {/* Bill To & Invoice Meta */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="rounded border border-slate-100 p-2.5 bg-slate-50">
              <p className="font-semibold text-slate-800 uppercase tracking-wider text-[10px]">
                {partyTitle || defaultPartyTitle}
              </p>
              <p className="font-bold text-sm text-slate-900">
                {party?.name || defaultPartyName}
              </p>
              {party?.phone && (
                <p className="text-slate-600">Phone: {party.phone}</p>
              )}
              {(party?.address || party?.city) && (
                <p className="text-slate-600">
                  {[party.address, party.city].filter(Boolean).join(", ")}
                </p>
              )}
              {party?.gstNo && (
                <p className="text-slate-600">GSTIN: {party.gstNo}</p>
              )}
              {party?.panNo && (
                <p className="text-slate-600">PAN: {party.panNo}</p>
              )}
            </div>

            <div className="rounded border border-slate-100 p-2.5 bg-slate-50 text-right">
              <p className="font-semibold text-slate-800 uppercase tracking-wider text-[10px]">
                Payment & Terms:
              </p>
              {billMode && (
                <p className="text-slate-700">
                  Mode: <span className="font-semibold">{billMode}</span>
                </p>
              )}
              {staffName && (
                <p className="text-slate-700">
                  {staffTitle || defaultStaffTitle}{" "}
                  <span className="font-semibold">{staffName}</span>
                </p>
              )}
              <p className="text-slate-700">
                Reference:{" "}
                <span className="font-semibold">{reference || "N/A"}</span>
              </p>
              <p className="text-slate-700">
                Rate Type:{" "}
                <span className="font-semibold">{rateFixType}</span>
              </p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[11px]">
                <th className="p-1.5 text-center">#</th>
                <th className="p-1.5 text-left">Item Description</th>
                <th className="p-1.5 text-left">Item Code</th>
                <th className="p-1.5 text-left">Purity</th>
                <th className="p-1.5 text-right">Net Wt</th>
                <th className="p-1.5 text-right">Rate (₹)</th>
                <th className="p-1.5 text-right">Labour (₹)</th>
                <th className="p-1.5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {itemLines.map((line, i) => (
                <tr key={i}>
                  <td className="p-1.5 text-center">{i + 1}</td>
                  <td className="p-1.5 font-medium">
                    {line.itemName || "Jewellery Item"}
                    {line.tagNo && line.tagNo !== line.itemCode && (
                      <span className="text-[10px] text-slate-400 block">
                        Tag: {line.tagNo}
                      </span>
                    )}
                  </td>
                  <td className="p-1.5 text-slate-600">
                    {line.itemCode || line.tagNo || "-"}
                  </td>
                  <td className="p-1.5">{line.purity || "22K"}</td>
                  <td className="p-1.5 text-right">
                    {Number(line.netWt || 0).toFixed(3)}g
                  </td>
                  <td className="p-1.5 text-right">
                    ₹{Number(line.rate || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="p-1.5 text-right">
                    ₹{Number(line.labourAmount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="p-1.5 text-right font-semibold">
                    ₹{Number(line.amount || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Invoice Totals Breakdown */}
          <div className="flex justify-between items-start text-xs pt-2">
            <div className="max-w-xs text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Remarks / Terms:</p>
              <p>
                {remarks ||
                  "All jewellery items are BIS Hallmarked. 100% Certified."}
              </p>
            </div>
            <div className="w-64 space-y-1.5 text-right">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium">
                  ₹
                  {subtotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>
                    -₹
                    {discountAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">GST ({taxRate}%):</span>
                <span>
                  ₹
                  {taxAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-1 font-bold text-sm text-slate-900">
                <span>Grand Total:</span>
                <span className="text-emerald-800">
                  ₹
                  {grandTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            <span>Print Document</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrintInvoiceModal;
