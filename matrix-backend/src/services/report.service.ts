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
    @page { size: A4; margin: 12mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #000; background: #fff; }
  </style>
</head>
<body>
  <div style="width: 100%;">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 1px solid #000;">
      <div>
        <h1 style="font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">{{company.name}}</h1>
        <div style="font-size: 12px; margin-top: 4px;">
          <p>{{company.address}}</p>
          <p>GSTIN: <strong>{{company.gstin}}</strong></p>
          <p>Phone: {{company.phone}}</p>
        </div>
      </div>
      <div style="text-align: right;">
        <h2 style="font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #000; display: inline-block; padding-bottom: 4px; margin-bottom: 8px;">{{invoiceTitle}}</h2>
        <div style="font-size: 14px; margin-top: 8px;">
          <p><span style="margin-right: 8px;">Invoice No:</span><strong>{{voucherNo}}</strong></p>
          <p style="margin-top: 4px;"><span style="margin-right: 8px;">Invoice Date:</span><strong>{{voucherDate}}</strong></p>
        </div>
      </div>
    </div>

    <!-- Customer & Payment Info -->
    <div style="margin-top: 16px; display: flex; border: 1px solid #000;">
      <!-- BILL TO -->
      <div style="flex: 1; padding: 8px; border-right: 1px solid #000;">
        <h3 style="font-size: 12px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 8px;">{{partyTitle}}</h3>
        <div style="font-size: 14px; line-height: 1.4;">
          <p style="font-weight: bold; font-size: 16px;">{{partyName}}</p>
          {{#if partyAddress}}<p>{{partyAddress}}</p>{{/if}}
          {{#if partyPhone}}<p>Ph: {{partyPhone}}</p>{{/if}}
          {{#if partyGst}}<p style="padding-top: 4px;">GSTIN: <strong>{{partyGst}}</strong></p>{{/if}}
        </div>
      </div>
      
      <!-- PAYMENT DETAILS -->
      <div style="flex: 1; padding: 8px;">
        <h3 style="font-size: 12px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 8px;">Payment Details</h3>
        <table style="font-size: 14px; width: 100%; border: none;">
          <tr><td style="width: 100px; padding-bottom: 2px;">Mode:</td><td style="padding-bottom: 2px;"><strong>{{billMode}}</strong></td></tr>
          <tr><td style="padding-bottom: 2px;">Rate Type:</td><td style="padding-bottom: 2px;"><strong>{{rateFixType}}</strong></td></tr>
          <tr><td style="padding-bottom: 2px;">Reference:</td><td style="padding-bottom: 2px;"><strong>{{reference}}</strong></td></tr>
          <tr><td style="padding-bottom: 2px;">Terms:</td><td style="padding-bottom: 2px;"><strong>Immediate</strong></td></tr>
          {{#if staffName}}
          <tr><td style="padding-bottom: 2px;">{{staffTitle}}:</td><td style="padding-bottom: 2px;"><strong>{{staffName}}</strong></td></tr>
          {{/if}}
        </table>
      </div>
    </div>

    <!-- Item Table -->
    <div style="margin-top: 16px;">
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 14px;">
        <thead>
          <tr>
            <th style="border: 1px solid #000; padding: 4px 8px; text-align: left; font-weight: bold; width: 30px;">#</th>
            <th style="border: 1px solid #000; padding: 4px 8px; text-align: left; font-weight: bold;">Item Description</th>
            <th style="border: 1px solid #000; padding: 4px 8px; text-align: left; font-weight: bold; width: 90px;">Code</th>
            <th style="border: 1px solid #000; padding: 4px 8px; text-align: left; font-weight: bold; width: 80px;">Purity</th>
            <th style="border: 1px solid #000; padding: 4px 8px; text-align: right; font-weight: bold; width: 90px;">Net Wt</th>
            <th style="border: 1px solid #000; padding: 4px 8px; text-align: right; font-weight: bold; width: 90px;">Rate</th>
            <th style="border: 1px solid #000; padding: 4px 8px; text-align: right; font-weight: bold; width: 90px;">Labour</th>
            <th style="border: 1px solid #000; padding: 4px 8px; text-align: right; font-weight: bold; width: 120px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          {{#each items}}
          <tr>
            <td style="border: 1px solid #000; padding: 4px 8px; text-align: center;">{{idx}}</td>
            <td style="border: 1px solid #000; padding: 4px 8px;">
              {{name}}
              {{#if groupName}}<span style="font-size: 12px; margin-left: 4px;">[{{groupName}}]</span>{{/if}}
            </td>
            <td style="border: 1px solid #000; padding: 4px 8px;">{{code}}</td>
            <td style="border: 1px solid #000; padding: 4px 8px;">22K</td>
            <td style="border: 1px solid #000; padding: 4px 8px; text-align: right;">{{netWt}}g</td>
            <td style="border: 1px solid #000; padding: 4px 8px; text-align: right;">₹{{rate}}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; text-align: right;">₹{{labourAmount}}</td>
            <td style="border: 1px solid #000; padding: 4px 8px; text-align: right; font-weight: 600;">₹{{amount}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
    </div>

    <!-- Totals Section -->
    <div style="margin-top: 16px; display: flex; justify-content: flex-end;">
      <div style="width: 280px; border: 1px solid #000;">
        <div style="padding: 8px; font-size: 14px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Subtotal</span>
            <span>₹{{subtotalFormatted}}</span>
          </div>
          {{#if discountFormatted}}
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Discount</span>
            <span>- ₹{{discountFormatted}}</span>
          </div>
          {{/if}}
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Taxable Amount</span>
            <span>₹{{taxableAmountFormatted}}</span>
          </div>
          {{#if taxFormatted}}
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>CGST ({{halfTaxRate}}%)</span>
            <span>₹{{halfTaxFormatted}}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>SGST ({{halfTaxRate}}%)</span>
            <span>₹{{halfTaxFormatted}}</span>
          </div>
          {{/if}}
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 4px;">
            <span>Round Off</span>
            <span>₹{{roundOffFormatted}}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; padding-top: 4px; font-weight: bold; font-size: 16px;">
            <span>GRAND TOTAL</span>
            <span>₹{{grandTotalFormatted}}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Amount formatted -->
    <div style="margin-top: 16px; border-top: 1px solid #000; padding-top: 8px;">
      <p style="font-size: 14px;">
        <span style="font-weight: bold; margin-right: 8px;">Amount:</span>
        <span style="font-weight: 600;">₹{{grandTotalFormatted}}</span>
      </p>
    </div>

    <!-- Remarks and Terms -->
    <div style="margin-top: 16px; font-size: 14px;">
      <p style="font-weight: bold; margin-bottom: 4px;">Remarks:</p>
      <p style="min-height: 30px; border-bottom: 1px solid #000; padding-bottom: 4px;">
        {{remarks}}
      </p>
      
      <div style="margin-top: 16px;">
        <p style="font-weight: bold; margin-bottom: 4px;">Terms & Conditions:</p>
        <ol style="margin-left: 20px; font-size: 12px; margin-top: 4px; padding-left: 0;">
          <li style="margin-bottom: 4px;">Goods/services once sold will be subject to company terms.</li>
          <li style="margin-bottom: 4px;">Payment should be made according to agreed payment terms.</li>
          <li style="margin-bottom: 4px;">Any dispute is subject to applicable jurisdiction.</li>
        </ol>
      </div>
    </div>

    <!-- Signatures -->
    <div style="margin-top: 48px; display: flex; justify-content: space-between; padding: 0 32px; font-size: 14px;">
      <div style="text-align: center;">
        <div style="width: 192px; border-bottom: 1px solid #000; margin-bottom: 4px;"></div>
        <p style="font-weight: bold;">Customer Signature</p>
      </div>
      <div style="text-align: center;">
        <div style="width: 192px; border-bottom: 1px solid #000; margin-bottom: 4px;"></div>
        <p style="font-weight: bold;">Authorized Signatory</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 32px; padding-top: 8px; border-top: 1px solid #000; display: flex; justify-content: space-between; font-size: 12px;">
      <p>Thank you for your business.</p>
      <p>Page 1 of 1</p>
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
      items,
      totalGrossWt: totalGrossWt.toFixed(3),
      totalNetWt: totalNetWt.toFixed(3),
      subtotalFormatted: formatCurrency(subtotal),
      discountFormatted: discount > 0 ? formatCurrency(discount) : null,
      taxRate: Number(sale.taxRate || 3),
      taxFormatted: formatCurrency(tax),
      roundOffFormatted: roundOff !== 0 ? formatCurrency(roundOff) : "0.00",
      taxableAmountFormatted: formatCurrency(subtotal - discount),
      halfTaxRate: 1.5,
      halfTaxFormatted: formatCurrency(tax / 2),
      grandTotalFormatted: formatCurrency(grandTotal),
      
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
