import JsReport from "@jsreport/jsreport-core";
import jsreportHandlebars from "@jsreport/jsreport-handlebars";
import jsreportChromePdf from "@jsreport/jsreport-chrome-pdf";
import { salesService } from "./sales.service.js";
import { purchaseService } from "./purchase.service.js";

let jsreportInstance: any = null;

async function getJsReport() {
  if (!jsreportInstance) {
    const jsreport = JsReport({
      parentModuleDirectory: process.cwd(),
      tasks: {
        strategy: "in-process",
      },
    });

    jsreport.use(jsreportHandlebars());
    jsreport.use(
      jsreportChromePdf({
        launchOptions: {
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      }),
    );

    await jsreport.init();
    jsreportInstance = jsreport;
  }
  return jsreportInstance;
}

function numberToWords(num: number): string {
  if (!num || num === 0) return "Zero Rupees Only";
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const inWords = (n: number): string => {
    if (n < 20) return a[n] || "";
    if (n < 100)
      return (b[Math.floor(n / 10)] || "") + (n % 10 ? " " + (a[n % 10] || "") : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        "Hundred " +
        (n % 100 ? "and " + inWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        "Thousand " +
        (n % 1000 ? inWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        "Lakh " +
        (n % 100000 ? inWords(n % 100000) : "")
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      "Crore " +
      (n % 10000000 ? inWords(n % 10000000) : "")
    );
  };

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);
  let result = "Rupees " + inWords(integerPart).trim();
  if (decimalPart > 0) {
    result += " and " + inWords(decimalPart).trim() + " Paise";
  }
  return result + " Only";
}

function formatCurrency(val: any): string {
  const num = Number(val || 0);
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(val: any): string {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const invoiceTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{invoiceTitle}} - {{voucherNo}}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      color: #1e293b;
      line-height: 1.4;
      background: #ffffff;
    }
    .invoice-container {
      border: 1px solid #cbd5e1;
      padding: 20px;
      border-radius: 4px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #b45309;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .company-title {
      font-size: 18px;
      font-weight: 800;
      color: #b45309;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }
    .company-subtitle {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .doc-badge {
      display: inline-block;
      background: #b45309;
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      text-align: right;
    }
    .doc-meta {
      text-align: right;
      margin-top: 5px;
      font-size: 10px;
    }
    .meta-grid {
      display: flex;
      gap: 12px;
      margin-bottom: 14px;
    }
    .meta-card {
      flex: 1;
      border: 1px solid #e2e8f0;
      background-color: #f8fafc;
      padding: 8px 12px;
      border-radius: 4px;
    }
    .meta-card-title {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
    }
    .meta-card-name {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 10px;
    }
    .items-table th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
    }
    .items-table td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
    }
    .items-table tr:nth-child(even) {
      background-color: #fafbfc;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }

    .totals-layout {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-top: 8px;
    }
    .terms-box {
      flex: 1;
      font-size: 9.5px;
      color: #475569;
    }
    .terms-title {
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 3px;
    }
    .amount-words-box {
      margin-top: 8px;
      padding: 6px 8px;
      background-color: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 3px;
      font-size: 9.5px;
    }
    .totals-table {
      width: 260px;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    .totals-table td {
      padding: 4px 6px;
    }
    .totals-table tr.total-row td {
      border-top: 1.5px solid #0f172a;
      border-bottom: 1.5px solid #0f172a;
      font-weight: 800;
      font-size: 12px;
      color: #0f172a;
    }
    .footer-signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 25px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      font-size: 9.5px;
    }
    .sign-box {
      text-align: center;
      width: 170px;
    }
    .sign-line {
      border-top: 1px solid #94a3b8;
      margin-top: 35px;
      padding-top: 4px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="company-title">{{company.name}}</div>
        <div class="company-subtitle">{{company.address}}</div>
        <div class="company-subtitle">GSTIN: <strong>{{company.gstin}}</strong> &bull; Phone: {{company.phone}}</div>
      </div>
      <div>
        <div class="doc-badge">{{invoiceTitle}}</div>
        <div class="doc-meta">
          <div><strong>Invoice #:</strong> {{voucherNo}}</div>
          <div><strong>Date:</strong> {{voucherDate}}</div>
        </div>
      </div>
    </div>

    <!-- Meta Grid -->
    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-card-title">{{partyTitle}}</div>
        <div class="meta-card-name">{{partyName}}</div>
        {{#if partyPhone}}<div>Phone: {{partyPhone}}</div>{{/if}}
        {{#if partyAddress}}<div>Address: {{partyAddress}}</div>{{/if}}
        {{#if partyGst}}<div>GSTIN: {{partyGst}}</div>{{/if}}
      </div>
      <div class="meta-card">
        <div class="meta-card-title">Voucher Details</div>
        <div><strong>Bill Mode:</strong> {{billMode}}</div>
        <div><strong>Daybook:</strong> {{daybookName}}</div>
        {{#if staffName}}<div><strong>{{staffTitle}}:</strong> {{staffName}}</div>{{/if}}
        {{#if reference}}<div><strong>Ref:</strong> {{reference}}</div>{{/if}}
        {{#if rateFixType}}<div><strong>Rate Type:</strong> {{rateFixType}}</div>{{/if}}
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="text-center" style="width: 25px;">#</th>
          <th>Item Description</th>
          <th>Item Code / Tag</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Gross Wt</th>
          <th class="text-right">Net Wt</th>
          <th class="text-right">Rate (₹)</th>
          <th class="text-right">Labour (₹)</th>
          <th class="text-right">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr>
          <td class="text-center">{{idx}}</td>
          <td class="font-semibold">
            {{name}}
            {{#if groupName}}<span style="color:#64748b; font-size: 9px; font-weight: normal; display: block;">({{groupName}})</span>{{/if}}
          </td>
          <td>{{code}}</td>
          <td class="text-right">{{qty}}</td>
          <td class="text-right">{{grossWt}}g</td>
          <td class="text-right font-semibold">{{netWt}}g</td>
          <td class="text-right">₹{{rate}}</td>
          <td class="text-right">₹{{labourAmount}}</td>
          <td class="text-right font-bold">₹{{amount}}</td>
        </tr>
        {{/each}}
      </tbody>
      <tfoot>
        <tr style="background-color: #f8fafc; font-weight: bold;">
          <td colspan="4" class="text-right">Total:</td>
          <td class="text-right">{{totalGrossWt}}g</td>
          <td class="text-right">{{totalNetWt}}g</td>
          <td colspan="2"></td>
          <td class="text-right">₹{{subtotalFormatted}}</td>
        </tr>
      </tfoot>
    </table>

    <!-- Totals Layout -->
    <div class="totals-layout">
      <div class="terms-box">
        <div class="terms-title">Terms & Conditions:</div>
        <div>1. All gold/diamond jewellery certified as per BIS Hallmarking standards.</div>
        <div>2. Subject to Ahmedabad jurisdiction.</div>
        <div>3. Goods once sold will only be exchanged or taken back as per showroom exchange policy.</div>
        {{#if remarks}}
          <div style="margin-top: 4px;"><strong>Remarks:</strong> {{remarks}}</div>
        {{/if}}

        <div class="amount-words-box">
          <strong>Amount in Words:</strong><br>
          <em>{{amountInWords}}</em>
        </div>
      </div>

      <table class="totals-table">
        <tr>
          <td>Subtotal (Taxable):</td>
          <td class="text-right font-semibold">₹{{subtotalFormatted}}</td>
        </tr>
        {{#if discountFormatted}}
        <tr style="color: #e11d48;">
          <td>Discount:</td>
          <td class="text-right font-semibold">-₹{{discountFormatted}}</td>
        </tr>
        {{/if}}
        <tr>
          <td>GST ({{taxRate}}%):</td>
          <td class="text-right font-semibold">₹{{taxFormatted}}</td>
        </tr>
        {{#if roundOffFormatted}}
        <tr>
          <td>Round Off:</td>
          <td class="text-right">₹{{roundOffFormatted}}</td>
        </tr>
        {{/if}}
        <tr class="total-row">
          <td>Grand Total:</td>
          <td class="text-right">₹{{grandTotalFormatted}}</td>
        </tr>
      </table>
    </div>

    <!-- Signatures -->
    <div class="footer-signatures">
      <div class="sign-box">
        <div class="sign-line">Customer Signature</div>
      </div>
      <div class="sign-box">
        <div style="font-weight: 700; color: #b45309;">For {{company.name}}</div>
        <div class="sign-line">Authorized Signatory</div>
      </div>
    </div>
  </div>
</body>
</html>
`;

export class ReportService {
  private companyInfo = {
    name: "MATRIX JEWELLERS & LUXURY RETAIL",
    address: "402, Matrix Heights, CG Road, Navrangpura, Ahmedabad - 380009",
    gstin: "24AAACM4901P1Z8",
    phone: "+91 79 2640 9811",
  };

  async renderSalesInvoice(saleId: number): Promise<Buffer> {
    const sale = await salesService.getSaleById(saleId);
    if (!sale) {
      throw new Error(`Sale voucher with ID ${saleId} not found`);
    }

    const subtotal = Number(sale.subtotal || 0);
    const discount = Number(sale.discountAmount || 0);
    const tax = Number(sale.taxAmount || 0);
    const roundOff = Number(sale.roundOff || 0);
    const grandTotal = Number(sale.grandTotal || 0);

    let totalGrossWt = 0;
    let totalNetWt = 0;

    const items = (sale.itemLines || []).map((item: any, i: number) => {
      const gWt = Number(item.grossWt || 0);
      const nWt = Number(item.netWt || 0);
      totalGrossWt += gWt;
      totalNetWt += nWt;

      return {
        idx: i + 1,
        name: item.itemName || "Jewellery Item",
        groupName: item.itemGroupName || "",
        code: item.itemCode || item.tagNo || "-",
        qty: Number(item.qty || 1),
        grossWt: gWt.toFixed(3),
        netWt: nWt.toFixed(3),
        rate: formatCurrency(item.rate),
        labourAmount: formatCurrency(item.labourAmount),
        amount: formatCurrency(item.amount),
      };
    });

    const reportData = {
      company: this.companyInfo,
      invoiceTitle: "RETAIL TAX INVOICE",
      partyTitle: "Billed To (Customer):",
      voucherNo: sale.voucherNo,
      voucherDate: formatDate(sale.voucherDate),
      partyName: sale.accountName || "Walk-in Customer",
      partyPhone: sale.customerPhone || "",
      partyAddress: "",
      partyGst: "",
      daybookName: sale.daybookName || "Sales Daybook",
      billMode: sale.billMode || "Cash",
      staffTitle: "Salesman",
      staffName: sale.salesmanName || "",
      reference: sale.reference || "",
      rateFixType: sale.rateFixType || "Fix",
      items,
      totalGrossWt: totalGrossWt.toFixed(3),
      totalNetWt: totalNetWt.toFixed(3),
      subtotalFormatted: formatCurrency(subtotal),
      discountFormatted: discount > 0 ? formatCurrency(discount) : null,
      taxRate: Number(sale.taxRate || 3),
      taxFormatted: formatCurrency(tax),
      roundOffFormatted: roundOff !== 0 ? formatCurrency(roundOff) : null,
      grandTotalFormatted: formatCurrency(grandTotal),
      amountInWords: numberToWords(grandTotal),
      remarks: sale.remarks || "",
    };

    const jsreport = await getJsReport();
    const result = await jsreport.render({
      template: {
        content: invoiceTemplate,
        engine: "handlebars",
        recipe: "chrome-pdf",
        chrome: {
          format: "A4",
          margin: {
            top: "10mm",
            bottom: "10mm",
            left: "10mm",
            right: "10mm",
          },
          displayHeaderFooter: false,
          printBackground: true,
        },
      },
      data: reportData,
    });

    return result.content;
  }

  async renderPurchaseInvoice(purchaseId: number): Promise<Buffer> {
    const purchase = await purchaseService.getPurchaseById(purchaseId);
    if (!purchase) {
      throw new Error(`Purchase voucher with ID ${purchaseId} not found`);
    }

    const subtotal = Number(purchase.totalTaxableAmount || 0);
    const grandTotal = Number(purchase.totalAmount || 0);
    const tax = Math.max(0, grandTotal - subtotal);

    let totalGrossWt = 0;
    let totalNetWt = 0;

    const items = (purchase.itemLines || []).map((item: any, i: number) => {
      const gWt = Number(item.grossWt || 0);
      const nWt = Number(item.netWt || 0);
      totalGrossWt += gWt;
      totalNetWt += nWt;

      return {
        idx: i + 1,
        name: item.itemName || "Jewellery Item",
        groupName: item.itemGroupName || "",
        code: item.itemCode || "-",
        qty: Number(item.qty || 1),
        grossWt: gWt.toFixed(3),
        netWt: nWt.toFixed(3),
        rate: formatCurrency(item.rate),
        labourAmount: "0.00",
        amount: formatCurrency(item.amount || item.amountWithTax || 0),
      };
    });

    const reportData = {
      company: this.companyInfo,
      invoiceTitle: "PURCHASE TAX INVOICE",
      partyTitle: "Purchased From (Supplier):",
      voucherNo: purchase.voucherNo,
      voucherDate: formatDate(purchase.voucherDate),
      partyName: purchase.accountName || "Registered Supplier",
      partyPhone: purchase.supplierPhone || "",
      partyAddress: "",
      partyGst: "",
      daybookName: purchase.daybookName || "Purchase Daybook",
      billMode: "Credit / Ledger",
      staffTitle: "Purchaser",
      staffName: "",
      reference: purchase.reference || "",
      rateFixType: "Fix",
      items,
      totalGrossWt: totalGrossWt.toFixed(3),
      totalNetWt: totalNetWt.toFixed(3),
      subtotalFormatted: formatCurrency(subtotal),
      discountFormatted: null,
      taxRate: 3,
      taxFormatted: formatCurrency(tax),
      roundOffFormatted: null,
      grandTotalFormatted: formatCurrency(grandTotal),
      amountInWords: numberToWords(grandTotal),
      remarks: purchase.remarks || "",
    };

    const jsreport = await getJsReport();
    const result = await jsreport.render({
      template: {
        content: invoiceTemplate,
        engine: "handlebars",
        recipe: "chrome-pdf",
        chrome: {
          format: "A4",
          margin: {
            top: "10mm",
            bottom: "10mm",
            left: "10mm",
            right: "10mm",
          },
          displayHeaderFooter: false,
          printBackground: true,
        },
      },
      data: reportData,
    });

    return result.content;
  }
}

export const reportService = new ReportService();
