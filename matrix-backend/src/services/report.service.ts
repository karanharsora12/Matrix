import JsReport from "@jsreport/jsreport-core";
import jsreportHandlebars from "@jsreport/jsreport-handlebars";
import jsreportChromePdf from "@jsreport/jsreport-chrome-pdf";
import { salesService } from "./sales.service";
import { printConfigService } from "./print-config.service";
import type { PrintConfigData } from "./print-config.service";

let jsreportInstance: any = null;

export async function getJsReport() {
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
      })
    );

    await jsreport.init();
    jsreportInstance = jsreport;
  }
  return jsreportInstance;
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

function formatCurrency(num: any): string {
  const n = Number(num);
  if (isNaN(n)) return "0.00";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
    let str = "";
    if (n > 9999999) {
      str += inWords(Math.floor(n / 10000000)) + "Crore ";
      n %= 10000000;
    }
    if (n > 99999) {
      str += inWords(Math.floor(n / 100000)) + "Lakh ";
      n %= 100000;
    }
    if (n > 999) {
      str += inWords(Math.floor(n / 1000)) + "Thousand ";
      n %= 1000;
    }
    if (n > 99) {
      str += inWords(Math.floor(n / 100)) + "Hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (str !== "") str += "and ";
      if (n < 20) {
        str += a[n];
      } else {
        str += b[Math.floor(n / 10)];
        if (n % 10 > 0) {
          str += " " + a[n % 10];
        } else {
          str += " ";
        }
      }
    }
    return str;
  };

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let result = inWords(integerPart).trim() + " Rupees";
  if (decimalPart > 0) {
    result += " and " + inWords(decimalPart).trim() + " Paise";
  }
  return result + " Only";
}

export const defaultInvoiceTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{{config.headerTitle}}</title>
  <style>
    @page {
      size: {{config.paperSize}} {{config.orientation}};
      margin: {{config.marginTop}} {{config.marginRight}} {{config.marginBottom}} {{config.marginLeft}};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      color: #111;
      background: #fff;
    }
    .invoice-container {
      width: 100%;
      border: 1.5px solid #222;
      border-radius: 4px;
      padding: 12px 14px;
      background: #fff;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #222;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .company-title {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #000;
    }
    .company-sub {
      font-size: 10px;
      color: #333;
      margin-top: 2px;
    }
    .doc-badge {
      text-align: right;
    }
    .doc-badge .title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 8px;
      background: #f0f0f0;
      display: inline-block;
      border: 1px solid #ccc;
      border-radius: 3px;
    }
    .doc-badge .subtitle {
      font-size: 9px;
      color: #666;
      margin-top: 2px;
    }

    .meta-box {
      width: 100%;
      display: flex;
      border: 1px solid #ccc;
      border-radius: 4px;
      margin-bottom: 8px;
      background: #fafafa;
    }
    .meta-col {
      flex: 1;
      padding: 6px 8px;
    }
    .meta-col:first-child {
      border-right: 1px solid #ddd;
    }
    .meta-heading {
      font-size: 9px;
      font-weight: 700;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 4px;
      border-bottom: 1px dotted #ccc;
      padding-bottom: 2px;
    }
    .meta-row {
      display: flex;
      margin-bottom: 2px;
      font-size: 10.5px;
    }
    .meta-label {
      width: 85px;
      color: #555;
      font-weight: 500;
    }
    .meta-value {
      flex: 1;
      color: #000;
      font-weight: 600;
    }

    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 10.5px;
    }
    .items-table th {
      background: #eaeaea;
      color: #000;
      font-weight: 700;
      padding: 5px 6px;
      text-align: left;
      border: 1px solid #bbb;
      font-size: 10px;
      text-transform: uppercase;
    }
    .items-table td {
      padding: 4px 6px;
      border: 1px solid #ccc;
      vertical-align: top;
    }
    .items-table tr:nth-child(even) td {
      background: #fafafa;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }

    /* Summary Section */
    .summary-grid {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }
    .summary-left {
      flex: 1.2;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 6px 8px;
      background: #fafafa;
      font-size: 10px;
    }
    .summary-right {
      flex: 1;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 6px 8px;
      background: #fff;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      font-size: 10.5px;
    }
    .calc-row.total {
      border-top: 1.5px solid #222;
      border-bottom: 1.5px solid #222;
      margin-top: 4px;
      padding: 4px 0;
      font-size: 12px;
      font-weight: 700;
    }
    .calc-row.balance {
      color: #991b1b;
      font-weight: 700;
      font-size: 11px;
      border-top: 1px dotted #ccc;
      padding-top: 3px;
      margin-top: 2px;
    }

    /* Words row */
    .words-box {
      border: 1px dashed #bbb;
      padding: 4px 8px;
      margin-bottom: 8px;
      font-size: 10px;
      background: #fdfdfd;
    }

    /* Terms & Signatures */
    .terms-box {
      font-size: 9px;
      color: #444;
      line-height: 1.3;
      margin-bottom: 8px;
      border-top: 1px solid #eee;
      padding-top: 4px;
    }
    .terms-title {
      font-weight: 700;
      color: #222;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .sign-section {
      display: flex;
      justify-content: space-between;
      margin-top: 25px;
      padding: 0 10px;
    }
    .sign-box {
      text-align: center;
      width: 160px;
    }
    .sign-line {
      border-bottom: 1px solid #333;
      margin-bottom: 4px;
      height: 25px;
    }
    .sign-label {
      font-size: 9.5px;
      font-weight: 600;
      color: #333;
    }

    .footer-note {
      text-align: center;
      font-size: 9px;
      color: #777;
      border-top: 1px solid #ddd;
      padding-top: 4px;
      margin-top: 8px;
    }
  </style>
  {{#if config.customTemplateCss}}
  <style>
    {{{config.customTemplateCss}}}
  </style>
  {{/if}}
</head>
<body>
  <div class="invoice-container">
    {{#if config.showHeader}}
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          {{#if config.showLogo}}
            {{#if config.logoUrl}}
              <img src="{{config.logoUrl}}" style="max-height: 40px; margin-bottom: 4px;" alt="Logo" />
            {{/if}}
          {{/if}}
          <div class="company-title">{{config.companyName}}</div>
          <div class="company-sub">
            {{#if config.companyAddress}}{{config.companyAddress}}<br/>{{/if}}
            {{#if config.companyPhone}}Ph: {{config.companyPhone}} {{/if}}
            {{#if config.companyEmail}}| Email: {{config.companyEmail}} {{/if}}
            {{#if config.companyGstin}}<br/><strong>GSTIN:</strong> {{config.companyGstin}}{{/if}}
            {{#if config.companyPan}} | <strong>PAN:</strong> {{config.companyPan}}{{/if}}
          </div>
        </td>
        <td class="doc-badge" style="vertical-align: top;">
          <div class="title">{{config.headerTitle}}</div>
          {{#if config.headerSubtitle}}
          <div class="subtitle">{{config.headerSubtitle}}</div>
          {{/if}}
        </td>
      </tr>
    </table>
    {{/if}}

    <!-- Customer & Voucher Info -->
    <div class="meta-box">
      {{#if config.showCustomerDetails}}
      <div class="meta-col">
        <div class="meta-heading">Customer / Party Details</div>
        <div class="meta-row">
          <span class="meta-label">Customer Name:</span>
          <span class="meta-value">{{customer.name}}</span>
        </div>
        {{#if customer.phone}}
        <div class="meta-row">
          <span class="meta-label">Phone No:</span>
          <span class="meta-value">{{customer.phone}}</span>
        </div>
        {{/if}}
        {{#if customer.address}}
        <div class="meta-row">
          <span class="meta-label">Address:</span>
          <span class="meta-value">{{customer.address}}</span>
        </div>
        {{/if}}
        {{#if customer.gstin}}
        <div class="meta-row">
          <span class="meta-label">GSTIN:</span>
          <span class="meta-value">{{customer.gstin}}</span>
        </div>
        {{/if}}
      </div>
      {{/if}}

      {{#if config.showVoucherDetails}}
      <div class="meta-col">
        <div class="meta-heading">Voucher Details</div>
        <div class="meta-row">
          <span class="meta-label">Invoice / Bill No:</span>
          <span class="meta-value">{{voucher.voucherNo}}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Date:</span>
          <span class="meta-value">{{voucher.voucherDate}}</span>
        </div>
        {{#if voucher.daybookName}}
        <div class="meta-row">
          <span class="meta-label">Daybook:</span>
          <span class="meta-value">{{voucher.daybookName}}</span>
        </div>
        {{/if}}
        {{#if voucher.salesmanName}}
        <div class="meta-row">
          <span class="meta-label">Salesman:</span>
          <span class="meta-value">{{voucher.salesmanName}}</span>
        </div>
        {{/if}}
        {{#if voucher.reference}}
        <div class="meta-row">
          <span class="meta-label">Ref / Receipt No:</span>
          <span class="meta-value">{{voucher.reference}}</span>
        </div>
        {{/if}}
      </div>
      {{/if}}
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 28px;" class="text-center">#</th>
          {{#if config.showItemDescription}}
          <th>Item Description / Service</th>
          {{/if}}
          {{#if config.showItemCode}}
          <th style="width: 70px;">Code / Tag</th>
          {{/if}}
          {{#if config.showGrossWeight}}
          <th style="width: 55px;" class="text-right">Gross Wt</th>
          {{/if}}
          {{#if config.showNetWeight}}
          <th style="width: 55px;" class="text-right">Net Wt</th>
          {{/if}}
          {{#if config.showQuantity}}
          <th style="width: 35px;" class="text-center">Qty</th>
          {{/if}}
          {{#if config.showLabour}}
          <th style="width: 65px;" class="text-right">Labour (₹)</th>
          {{/if}}
          {{#if config.showRate}}
          <th style="width: 65px;" class="text-right">Rate (₹)</th>
          {{/if}}
          {{#if config.showDiscount}}
          <th style="width: 50px;" class="text-right">Disc (₹)</th>
          {{/if}}
          {{#if config.showTax}}
          <th style="width: 45px;" class="text-right">Tax %</th>
          {{/if}}
          {{#if config.showAmount}}
          <th style="width: 75px;" class="text-right">Amount (₹)</th>
          {{/if}}
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr>
          <td class="text-center">{{idx}}</td>
          {{#if ../config.showItemDescription}}
          <td>
            <div class="font-bold">{{name}}</div>
            {{#if remarks}}<div style="font-size: 9px; color: #555;">{{remarks}}</div>{{/if}}
          </td>
          {{/if}}
          {{#if ../config.showItemCode}}
          <td>{{code}}</td>
          {{/if}}
          {{#if ../config.showGrossWeight}}
          <td class="text-right">{{grossWt}}</td>
          {{/if}}
          {{#if ../config.showNetWeight}}
          <td class="text-right">{{netWt}}</td>
          {{/if}}
          {{#if ../config.showQuantity}}
          <td class="text-center">{{qty}}</td>
          {{/if}}
          {{#if ../config.showLabour}}
          <td class="text-right">{{labourAmount}}</td>
          {{/if}}
          {{#if ../config.showRate}}
          <td class="text-right">{{rate}}</td>
          {{/if}}
          {{#if ../config.showDiscount}}
          <td class="text-right">{{discountAmount}}</td>
          {{/if}}
          {{#if ../config.showTax}}
          <td class="text-right">{{taxRate}}%</td>
          {{/if}}
          {{#if ../config.showAmount}}
          <td class="text-right font-bold">{{amount}}</td>
          {{/if}}
        </tr>
        {{/each}}
      </tbody>
      <tfoot>
        <tr style="background: #f2f2f2; font-weight: 700;">
          <td colspan="{{summaryColspan}}" class="text-right">Total</td>
          {{#if config.showGrossWeight}}
          <td class="text-right">{{totals.grossWt}}</td>
          {{/if}}
          {{#if config.showNetWeight}}
          <td class="text-right">{{totals.netWt}}</td>
          {{/if}}
          {{#if config.showQuantity}}
          <td class="text-center">{{totals.qty}}</td>
          {{/if}}
          {{#if config.showLabour}}
          <td class="text-right">{{totals.labourAmount}}</td>
          {{/if}}
          {{#if config.showRate}}
          <td></td>
          {{/if}}
          {{#if config.showDiscount}}
          <td class="text-right">{{totals.discountAmount}}</td>
          {{/if}}
          {{#if config.showTax}}
          <td></td>
          {{/if}}
          {{#if config.showAmount}}
          <td class="text-right">{{totals.itemsTotal}}</td>
          {{/if}}
        </tr>
      </tfoot>
    </table>

    <!-- Amount in words -->
    <div class="words-box">
      <strong>Amount in Words:</strong> {{totals.amountInWords}}
    </div>

    <!-- Summary Details (Tax + Payment) -->
    <div class="summary-grid">
      <div class="summary-left">
        {{#if config.showTaxSummary}}
        <div style="font-weight: 700; text-transform: uppercase; margin-bottom: 4px; border-bottom: 1px dotted #ccc; padding-bottom: 2px;">
          Tax Details
        </div>
        <div class="calc-row">
          <span>Taxable Amount:</span>
          <span>₹{{totals.taxableAmount}}</span>
        </div>
        <div class="calc-row">
          <span>CGST ({{totals.halfTaxRate}}%):</span>
          <span>₹{{totals.cgstAmount}}</span>
        </div>
        <div class="calc-row">
          <span>SGST ({{totals.halfTaxRate}}%):</span>
          <span>₹{{totals.sgstAmount}}</span>
        </div>
        <div class="calc-row" style="font-weight: 600; border-top: 1px dotted #ddd; padding-top: 2px;">
          <span>Total Tax:</span>
          <span>₹{{totals.taxAmount}}</span>
        </div>
        {{/if}}

        {{#if voucher.remarks}}
        <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dotted #ccc;">
          <strong>Remarks:</strong> {{voucher.remarks}}
        </div>
        {{/if}}
      </div>

      <div class="summary-right">
        <div class="calc-row">
          <span>Sub Total:</span>
          <span>₹{{totals.subtotal}}</span>
        </div>
        {{#if totals.hasDiscount}}
        <div class="calc-row">
          <span>Discount:</span>
          <span>- ₹{{totals.discountAmount}}</span>
        </div>
        {{/if}}
        <div class="calc-row">
          <span>Total GST:</span>
          <span>+ ₹{{totals.taxAmount}}</span>
        </div>
        {{#if totals.hasRoundOff}}
        <div class="calc-row">
          <span>Round Off:</span>
          <span>₹{{totals.roundOff}}</span>
        </div>
        {{/if}}
        <div class="calc-row total">
          <span>GRAND TOTAL:</span>
          <span>₹{{totals.grandTotal}}</span>
        </div>

        {{#if config.showPaymentSummary}}
          {{#if config.showAdvancePaid}}
          <div class="calc-row" style="margin-top: 3px;">
            <span>Advance / Paid:</span>
            <span>₹{{totals.advancePaid}}</span>
          </div>
          {{/if}}
          {{#if config.showBalanceDue}}
          <div class="calc-row balance">
            <span>BALANCE DUE:</span>
            <span>₹{{totals.balanceDue}}</span>
          </div>
          {{/if}}
        {{/if}}
      </div>
    </div>

    <!-- Terms and Conditions -->
    {{#if config.termsAndConditions}}
    <div class="terms-box">
      <div class="terms-title">Terms & Conditions:</div>
      <div style="white-space: pre-line;">{{config.termsAndConditions}}</div>
    </div>
    {{/if}}

    <!-- Signatures -->
    <div class="sign-section">
      {{#if config.showCustomerSignature}}
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">Customer Signature</div>
      </div>
      {{/if}}

      {{#if config.showAuthorizedSignature}}
      <div class="sign-box">
        <div class="sign-line"></div>
        <div class="sign-label">{{config.signatureLabel}}</div>
      </div>
      {{/if}}
    </div>

    <!-- Footer note -->
    {{#if config.showFooter}}
      {{#if config.footerText}}
      <div class="footer-note">{{config.footerText}}</div>
      {{/if}}
    {{/if}}
  </div>
</body>
</html>`;

export class ReportService {
  /**
   * Builds the report data model for a Repairing Bill or Sale transaction
   */
  async buildTransactionReportData(saleId: number, configOverride?: Partial<PrintConfigData>) {
    const sale = await salesService.getSaleById(saleId);
    if (!sale) {
      throw new Error(`Transaction with ID ${saleId} not found`);
    }

    // Determine transaction type
    const transactionType = (sale as any).voucherType || "repairing-bill";
    const dbConfig = await printConfigService.getConfig(transactionType);
    const config: PrintConfigData = {
      ...dbConfig,
      ...configOverride,
    };

    const subtotal = Number(sale.subtotal || 0);
    const discountAmount = Number(sale.discountAmount || 0);
    const taxAmount = Number(sale.taxAmount || 0);
    const roundOff = Number(sale.roundOff || 0);
    const grandTotal = Number(sale.grandTotal || 0);
    const advancePaid = Number(sale.advanceAmount || (sale as any).paidAmount || 0);
    const balanceDue = Number(sale.balanceAmount || Math.max(0, grandTotal - advancePaid));

    let totalGrossWt = 0;
    let totalNetWt = 0;
    let totalLabour = 0;
    let totalQty = 0;
    let totalLineDiscounts = 0;
    let totalLineAmounts = 0;

    const items = (sale.itemLines || []).map((item: any, i: number) => {
      const gWt = Number(item.grossWt || 0);
      const nWt = Number(item.netWt || 0);
      const qty = Number(item.qty || 1);
      const labour = Number(item.labourAmount || 0);
      const disc = Number(item.discountAmount || 0);
      const rawAmt = Number(item.amount || 0);
      const lineTotal = Number(
        item.totalAmount || (rawAmt + labour > 0 ? rawAmt + labour : rawAmt)
      );

      totalGrossWt += gWt;
      totalNetWt += nWt;
      totalQty += qty;
      totalLabour += labour;
      totalLineDiscounts += disc;
      totalLineAmounts += lineTotal;

      return {
        idx: i + 1,
        name: item.itemName || "Jewellery Repair Item",
        code: item.itemCode || item.tagNo || "-",
        grossWt: gWt.toFixed(3),
        netWt: nWt.toFixed(3),
        qty,
        labourAmount: formatCurrency(labour),
        rate: formatCurrency(item.rate || 0),
        discountAmount: formatCurrency(disc),
        taxRate: Number(item.taxRate || sale.taxRate || 3),
        amount: formatCurrency(lineTotal),
        remarks: item.remarks || "",
      };
    });

    const taxRate = Number(sale.taxRate || 3);
    const halfTaxRate = taxRate / 2;
    const halfTax = taxAmount / 2;

    // Colspan for summary totals row
    let summaryColspan = 1; // index
    if (config.showItemDescription) summaryColspan++;
    if (config.showItemCode) summaryColspan++;

    return {
      config,
      customer: {
        name: sale.accountName || "Walk-in Customer",
        phone: sale.customerPhone || "",
        address: (sale as any).customerAddress || (sale as any).city || "",
        gstin: (sale as any).customerGstin || "",
      },
      voucher: {
        voucherNo: sale.voucherNo,
        voucherDate: formatDate(sale.voucherDate),
        daybookName: sale.daybookName || "",
        salesmanName: sale.salesmanName || "",
        reference: sale.customerReference || (sale as any).reference || "",
        remarks: sale.remarks || "",
      },
      items,
      summaryColspan,
      totals: {
        grossWt: totalGrossWt.toFixed(3),
        netWt: totalNetWt.toFixed(3),
        qty: totalQty,
        labourAmount: formatCurrency(totalLabour),
        discountAmount: formatCurrency(discountAmount || totalLineDiscounts),
        itemsTotal: formatCurrency(totalLineAmounts || subtotal),
        taxableAmount: formatCurrency(Number(subtotal - discountAmount)),
        subtotal: formatCurrency(subtotal),
        hasDiscount: discountAmount > 0,
        taxRate,
        halfTaxRate,
        cgstAmount: formatCurrency(halfTax),
        sgstAmount: formatCurrency(halfTax),
        taxAmount: formatCurrency(taxAmount),
        hasRoundOff: roundOff !== 0,
        roundOff: formatCurrency(roundOff),
        grandTotal: formatCurrency(grandTotal),
        advancePaid: formatCurrency(advancePaid),
        balanceDue: formatCurrency(balanceDue),
        amountInWords: numberToWords(grandTotal),
      },
    };
  }

  /**
   * Render invoice to PDF Buffer using jsreport
   */
  async renderTransactionPdf(saleId: number, configOverride?: Partial<PrintConfigData>): Promise<{
    buffer: Buffer;
    voucherNo: string;
    config: PrintConfigData;
  }> {
    const reportData = await this.buildTransactionReportData(saleId, configOverride);
    const config = reportData.config;

    const htmlContent = config.customTemplateHtml?.trim() || defaultInvoiceTemplate;

    const jsreport = await getJsReport();
    const result = await jsreport.render({
      template: {
        content: htmlContent,
        engine: "handlebars",
        recipe: "chrome-pdf",
        chrome: {
          format: config.paperSize || "A4",
          landscape: config.orientation === "landscape",
          margin: {
            top: config.marginTop || "10mm",
            bottom: config.marginBottom || "10mm",
            left: config.marginLeft || "10mm",
            right: config.marginRight || "10mm",
          },
          displayHeaderFooter: false,
          printBackground: true,
        },
      },
      data: reportData,
    });

    return {
      buffer: result.content,
      voucherNo: reportData.voucher.voucherNo,
      config,
    };
  }

  /**
   * Render invoice HTML directly for preview / live editing
   */
  async renderTransactionHtml(saleId: number, configOverride?: Partial<PrintConfigData>): Promise<string> {
    const reportData = await this.buildTransactionReportData(saleId, configOverride);
    const config = reportData.config;
    const htmlContent = config.customTemplateHtml?.trim() || defaultInvoiceTemplate;

    const jsreport = await getJsReport();
    const result = await jsreport.render({
      template: {
        content: htmlContent,
        engine: "handlebars",
        recipe: "html",
      },
      data: reportData,
    });

    return result.content.toString();
  }

  /**
   * Sample preview data for Print Setup configuration screen
   */
  getSampleReportData(configOverride?: Partial<PrintConfigData>) {
    const config: PrintConfigData = {
      ...printConfigService.getDefaultConfigObject("repairing-bill"),
      ...configOverride,
    };

    let summaryColspan = 1;
    if (config.showItemDescription) summaryColspan++;
    if (config.showItemCode) summaryColspan++;

    return {
      config,
      customer: {
        name: "Shri Rajesh Sharma",
        phone: "+91 98250 12345",
        address: "14, Shivalik Villa, Bodakdev, Ahmedabad - 380054",
        gstin: "24AABCS1429B1Z1",
      },
      voucher: {
        voucherNo: "RB-2026-0042",
        voucherDate: formatDate(new Date()),
        daybookName: "Repairing Bill Daybook",
        salesmanName: "Vikram S.",
        reference: "REC-2026-0019",
        remarks: "Stone resetting & rhodium polish completed. Hallmark inspected.",
      },
      items: [
        {
          idx: 1,
          name: "22K Gold Antique Bangle Repair & Resizing",
          code: "REP-0104",
          grossWt: "24.500",
          netWt: "24.500",
          qty: 1,
          labourAmount: "1,850.00",
          rate: "0.00",
          discountAmount: "0.00",
          taxRate: 3,
          amount: "1,850.00",
          remarks: "Inner lock replacement + ultrasonic cleaning",
        },
        {
          idx: 2,
          name: "Diamond Solitaire Ring Prong Retipping",
          code: "REP-0105",
          grossWt: "4.200",
          netWt: "4.050",
          qty: 1,
          labourAmount: "1,200.00",
          rate: "0.00",
          discountAmount: "100.00",
          taxRate: 3,
          amount: "1,100.00",
          remarks: "4 prongs reinforced with 18K white gold",
        },
      ],
      summaryColspan,
      totals: {
        grossWt: "28.700",
        netWt: "28.550",
        qty: 2,
        labourAmount: "3,050.00",
        discountAmount: "100.00",
        itemsTotal: "2,950.00",
        taxableAmount: "2,950.00",
        subtotal: "3,050.00",
        hasDiscount: true,
        taxRate: 3,
        halfTaxRate: 1.5,
        cgstAmount: "44.25",
        sgstAmount: "44.25",
        taxAmount: "88.50",
        hasRoundOff: true,
        roundOff: "0.50",
        grandTotal: "3,039.00",
        advancePaid: "1,000.00",
        balanceDue: "2,039.00",
        amountInWords: "Three Thousand Thirty Nine Rupees Only",
      },
    };
  }

  /**
   * Render sample preview to PDF
   */
  async renderSamplePdf(configOverride?: Partial<PrintConfigData>): Promise<Buffer> {
    const reportData = this.getSampleReportData(configOverride);
    const config = reportData.config;
    const htmlContent = config.customTemplateHtml?.trim() || defaultInvoiceTemplate;

    const jsreport = await getJsReport();
    const result = await jsreport.render({
      template: {
        content: htmlContent,
        engine: "handlebars",
        recipe: "chrome-pdf",
        chrome: {
          format: config.paperSize || "A4",
          landscape: config.orientation === "landscape",
          margin: {
            top: config.marginTop || "10mm",
            bottom: config.marginBottom || "10mm",
            left: config.marginLeft || "10mm",
            right: config.marginRight || "10mm",
          },
          displayHeaderFooter: false,
          printBackground: true,
        },
      },
      data: reportData,
    });

    return result.content;
  }

  /**
   * Render sample preview to HTML
   */
  async renderSampleHtml(configOverride?: Partial<PrintConfigData>): Promise<string> {
    const reportData = this.getSampleReportData(configOverride);
    const config = reportData.config;
    const htmlContent = config.customTemplateHtml?.trim() || defaultInvoiceTemplate;

    const jsreport = await getJsReport();
    const result = await jsreport.render({
      template: {
        content: htmlContent,
        engine: "handlebars",
        recipe: "html",
      },
      data: reportData,
    });

    return result.content.toString();
  }
}

export const reportService = new ReportService();
