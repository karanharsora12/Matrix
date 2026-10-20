import { eq, desc } from "drizzle-orm";
import nodemailer, { type Transporter, type SendMailOptions } from "nodemailer";
import { db } from "../db";
import { emailTemplates, emailLogs } from "../db/schema";
import { reportService } from "./report.service";

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
}

export interface SendEmailPayload {
  transactionId: number;
  transactionType?: string;
  templateKey?: string;
  recipientEmail: string;
  subject?: string;
  bodyHtml?: string;
  attachPdf?: boolean;
  userId?: number;
}

export const DEFAULT_PLACEHOLDERS = [
  { key: "customerName", label: "Customer Name", example: "Rajesh Sharma" },
  { key: "customerPhone", label: "Customer Mobile", example: "+91 98250 12345" },
  { key: "customerEmail", label: "Customer Email", example: "rajesh@example.com" },
  { key: "voucherNo", label: "Bill / Invoice No", example: "RB-2026-0042" },
  { key: "voucherDate", label: "Invoice Date", example: "20/10/2026" },
  { key: "grandTotal", label: "Grand Total (₹)", example: "15,400.00" },
  { key: "advancePaid", label: "Advance Paid (₹)", example: "5,000.00" },
  { key: "balanceDue", label: "Balance Due (₹)", example: "10,400.00" },
  { key: "subtotal", label: "Sub Total (₹)", example: "15,000.00" },
  { key: "taxAmount", label: "GST Amount (₹)", example: "400.00" },
  { key: "labourAmount", label: "Labour Charges (₹)", example: "1,850.00" },
  { key: "discountAmount", label: "Discount (₹)", example: "0.00" },
  { key: "companyName", label: "Store / Company Name", example: "MATRIX JEWELLERS & LUXURY RETAIL" },
  { key: "companyPhone", label: "Store Phone", example: "+91 79 2640 9811" },
  { key: "companyEmail", label: "Store Email", example: "info@matrixjewellers.com" },
  { key: "companyAddress", label: "Store Address", example: "402, Matrix Heights, CG Road, Ahmedabad" },
  { key: "remarks", label: "Delivery / Repair Remarks", example: "Stone tested & cleaned. 6 months warranty." },
  { key: "itemsList", label: "Itemized Repair Items Table", example: "(HTML Table of items)" },
];

export const DEFAULT_REPAIRING_BILL_BODY = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Repairing Bill Invoice</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 28px 24px; color: #ffffff; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; color: #f8fafc; }
    .header p { margin: 6px 0 0; font-size: 12px; color: #cbd5e1; }
    .content { padding: 28px 24px; }
    .greeting { font-size: 15px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
    .intro { font-size: 13px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
    .stats-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .stats-grid { display: table; width: 100%; border-collapse: collapse; }
    .stats-cell { display: table-cell; padding: 6px 10px; width: 50%; vertical-align: top; }
    .stat-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
    .stat-val { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px; }
    .stat-val.balance { color: #dc2626; font-size: 15px; }
    .stat-val.paid { color: #16a34a; }
    .table-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #334155; margin-bottom: 8px; letter-spacing: 0.5px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; }
    .items-table th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 1px solid #cbd5e1; }
    .items-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .items-table .text-right { text-align: right; }
    .items-table .text-center { text-align: center; }
    .remarks-box { background: #fefce8; border-left: 4px solid #eab308; padding: 12px 14px; border-radius: 4px; font-size: 12px; color: #713f12; margin-bottom: 24px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.5; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
    .badge-paid { background: #dcfce7; color: #15803d; }
    .badge-due { background: #fee2e2; color: #b91c1c; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{companyName}}</h1>
      <p>Luxury Jewellery Repair & Craftsmanship Services</p>
    </div>

    <div class="content">
      <div class="greeting">Dear {{customerName}},</div>
      <div class="intro">
        Thank you for trusting us with your precious jewellery. Your repairing invoice <strong>#{{voucherNo}}</strong> has been generated and your serviced ornaments are ready. Please find the invoice summary below:
      </div>

      <div class="stats-card">
        <div class="stats-grid">
          <div class="stats-cell">
            <div class="stat-label">Invoice / Bill No.</div>
            <div class="stat-val">{{voucherNo}}</div>
          </div>
          <div class="stats-cell">
            <div class="stat-label">Invoice Date</div>
            <div class="stat-val">{{voucherDate}}</div>
          </div>
        </div>
        <div style="height: 12px;"></div>
        <div class="stats-grid">
          <div class="stats-cell">
            <div class="stat-label">Grand Total</div>
            <div class="stat-val">₹{{grandTotal}}</div>
          </div>
          <div class="stats-cell">
            <div class="stat-label">Advance Paid</div>
            <div class="stat-val paid">₹{{advancePaid}}</div>
          </div>
        </div>
        <div style="height: 12px;"></div>
        <div class="stats-grid">
          <div class="stats-cell">
            <div class="stat-label">Balance Payable</div>
            <div class="stat-val balance">₹{{balanceDue}}</div>
          </div>
          <div class="stats-cell">
            <div class="stat-label">Payment Status</div>
            <div class="stat-val">
              <span class="badge {{#if (eq balanceDue '0.00')}}badge-paid{{else}}badge-due{{/if}}">
                {{#if (eq balanceDue '0.00')}}Fully Settled{{else}}Balance Pending{{/if}}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="table-title">Billable Repair Items</div>
      {{itemsList}}

      <div class="remarks-box">
        <strong>Remarks & Delivery Notes:</strong><br>
        {{remarks}}
      </div>

      <div style="font-size: 12px; color: #475569; line-height: 1.6; margin-top: 16px;">
        Please retain this invoice or show this email upon collecting your jewellery at our boutique. An official PDF copy is attached for your records.
      </div>
    </div>

    <div class="footer">
      <strong>{{companyName}}</strong><br>
      {{companyAddress}}<br>
      Tel: {{companyPhone}} | Email: {{companyEmail}}<br>
      <em>This is an automated invoice communication generated by Matrix ERP.</em>
    </div>
  </div>
</body>
</html>`;

export class EmailService {
  /**
   * Get built-in fallback template configuration
   */
  getDefaultTemplateObject(templateKey: string): EmailTemplateData {
    if (templateKey === "repairing-bill") {
      return {
        templateKey: "repairing-bill",
        templateName: "Repairing Bill Invoice",
        subject: "Repairing Bill Invoice #{{voucherNo}} - {{companyName}}",
        bodyHtml: DEFAULT_REPAIRING_BILL_BODY,
        bodyText: "Dear {{customerName}},\n\nThank you for choosing {{companyName}}. Your repairing invoice #{{voucherNo}} has been generated for ₹{{grandTotal}}.\n\nAdvance: ₹{{advancePaid}}\nBalance Due: ₹{{balanceDue}}\n\nAttached is your invoice copy.\n\nWarm regards,\n{{companyName}}\n{{companyPhone}}",
        senderName: "Matrix Jewellers",
        replyTo: "billing@matrixjewellers.com",
        cc: "",
        bcc: "",
        attachPdf: true,
        pdfTemplateKey: "default",
        availablePlaceholders: JSON.stringify(DEFAULT_PLACEHOLDERS),
        isActive: true,
      };
    }

    if (templateKey === "repairing-receipt") {
      return {
        templateKey: "repairing-receipt",
        templateName: "Repairing Job Work Receipt",
        subject: "Repairing Receipt #{{voucherNo}} - {{companyName}}",
        bodyHtml: DEFAULT_REPAIRING_BILL_BODY,
        bodyText: "Dear {{customerName}},\n\nWe have received your items for repair under Receipt #{{voucherNo}}.\n\nEstimated: ₹{{grandTotal}}\nAdvance Received: ₹{{advancePaid}}\n\nWarm regards,\n{{companyName}}",
        senderName: "Matrix Jewellers",
        replyTo: "support@matrixjewellers.com",
        cc: "",
        bcc: "",
        attachPdf: true,
        pdfTemplateKey: "default",
        availablePlaceholders: JSON.stringify(DEFAULT_PLACEHOLDERS),
        isActive: true,
      };
    }

    return {
      templateKey,
      templateName: "Sales Tax Invoice",
      subject: "Tax Invoice #{{voucherNo}} - {{companyName}}",
      bodyHtml: DEFAULT_REPAIRING_BILL_BODY,
      bodyText: "Dear {{customerName}},\n\nThank you for your purchase. Please find your invoice #{{voucherNo}} attached.\n\nTotal: ₹{{grandTotal}}\n\nWarm regards,\n{{companyName}}",
      senderName: "Matrix Jewellers",
      replyTo: "accounts@matrixjewellers.com",
      cc: "",
      bcc: "",
      attachPdf: true,
      pdfTemplateKey: "default",
      availablePlaceholders: JSON.stringify(DEFAULT_PLACEHOLDERS),
      isActive: true,
    };
  }

  /**
   * Fetch all email templates
   */
  async getAllTemplates(): Promise<EmailTemplateData[]> {
    const rows = await db
      .select()
      .from(emailTemplates)
      .orderBy(emailTemplates.templateKey);

    if (rows.length > 0) {
      return rows as EmailTemplateData[];
    }

    // Return default set
    return [
      this.getDefaultTemplateObject("repairing-bill"),
      this.getDefaultTemplateObject("repairing-receipt"),
      this.getDefaultTemplateObject("sales"),
    ];
  }

  /**
   * Fetch single template by key
   */
  async getTemplate(templateKey: string): Promise<EmailTemplateData> {
    const rows = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.templateKey, templateKey))
      .limit(1);

    if (rows.length > 0) {
      return rows[0] as EmailTemplateData;
    }

    return this.getDefaultTemplateObject(templateKey);
  }

  /**
   * Create or update template
   */
  async saveTemplate(data: EmailTemplateData, userId?: number): Promise<EmailTemplateData> {
    const existing = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.templateKey, data.templateKey))
      .limit(1);

    const payload = {
      templateKey: data.templateKey,
      templateName: data.templateName || "Email Template",
      subject: data.subject || "Invoice #{{voucherNo}}",
      bodyHtml: data.bodyHtml || DEFAULT_REPAIRING_BILL_BODY,
      bodyText: data.bodyText || "",
      senderName: data.senderName || "Matrix Jewellers",
      replyTo: data.replyTo || null,
      cc: data.cc || null,
      bcc: data.bcc || null,
      attachPdf: data.attachPdf !== false,
      pdfTemplateKey: data.pdfTemplateKey || "default",
      availablePlaceholders: data.availablePlaceholders || JSON.stringify(DEFAULT_PLACEHOLDERS),
      isActive: data.isActive !== false,
      updatedAt: new Date(),
      editBy: userId || null,
    };

    if (existing.length > 0) {
      const [updated] = await db
        .update(emailTemplates)
        .set(payload)
        .where(eq(emailTemplates.templateKey, data.templateKey))
        .returning();
      return updated as EmailTemplateData;
    } else {
      const [created] = await db
        .insert(emailTemplates)
        .values({
          ...payload,
          addBy: userId || null,
        })
        .returning();
      return created as EmailTemplateData;
    }
  }

  /**
   * Reset template to factory default
   */
  async resetTemplate(templateKey: string, userId?: number): Promise<EmailTemplateData> {
    const def = this.getDefaultTemplateObject(templateKey);
    return await this.saveTemplate(def, userId);
  }

  /**
   * Build HTML itemized table string
   */
  private generateItemsHtmlTable(items: any[]): string {
    if (!items || items.length === 0) {
      return "<p style='font-size: 12px; color: #64748b;'>No line items recorded.</p>";
    }

    const rows = items
      .map(
        (it) => `
      <tr>
        <td style="text-align: center; border-bottom: 1px solid #f1f5f9; padding: 8px 10px;">${it.idx}</td>
        <td style="border-bottom: 1px solid #f1f5f9; padding: 8px 10px;">
          <strong style="color: #0f172a;">${it.name}</strong>
          ${it.remarks ? `<br><span style="font-size: 10px; color: #64748b;">${it.remarks}</span>` : ""}
        </td>
        <td style="text-align: right; border-bottom: 1px solid #f1f5f9; padding: 8px 10px;">${it.grossWt}g</td>
        <td style="text-align: right; border-bottom: 1px solid #f1f5f9; padding: 8px 10px;">₹${it.labourAmount}</td>
        <td style="text-align: right; border-bottom: 1px solid #f1f5f9; padding: 8px 10px; font-weight: 600;">₹${it.amount}</td>
      </tr>`
      )
      .join("");

    return `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px;">
      <thead>
        <tr style="background: #f8fafc; border-bottom: 1px solid #cbd5e1; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569;">
          <th style="padding: 9px 10px; text-align: center; width: 40px;">#</th>
          <th style="padding: 9px 10px;">Item Description</th>
          <th style="padding: 9px 10px; text-align: right; width: 80px;">Gross Wt</th>
          <th style="padding: 9px 10px; text-align: right; width: 90px;">Labour</th>
          <th style="padding: 9px 10px; text-align: right; width: 100px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
  }

  /**
   * Helper to replace placeholders like {{key}}
   */
  private replacePlaceholders(templateStr: string, dict: Record<string, any>): string {
    return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      return dict[key] != null ? String(dict[key]) : "";
    });
  }

  /**
   * Preview resolved email for a transaction
   */
  async previewTransactionEmail(transactionId: number, templateKey: string = "repairing-bill") {
    const reportData = await reportService.buildTransactionReportData(transactionId);
    const template = await this.getTemplate(templateKey);

    const itemsTableHtml = this.generateItemsHtmlTable(reportData.items);

    const dict: Record<string, any> = {
      customerName: reportData.customer.name || "Customer",
      customerPhone: reportData.customer.phone || "",
      customerEmail: (reportData.customer as any).email || "",
      voucherNo: reportData.voucher.voucherNo || "",
      voucherDate: reportData.voucher.voucherDate || "",
      grandTotal: reportData.totals.grandTotal || "0.00",
      advancePaid: reportData.totals.advancePaid || "0.00",
      balanceDue: reportData.totals.balanceDue || "0.00",
      subtotal: reportData.totals.subtotal || "0.00",
      taxAmount: reportData.totals.taxAmount || "0.00",
      labourAmount: reportData.totals.labourAmount || "0.00",
      discountAmount: reportData.totals.discountAmount || "0.00",
      companyName: reportData.config.companyName || "Matrix Jewellers",
      companyPhone: reportData.config.companyPhone || "",
      companyEmail: reportData.config.companyEmail || "",
      companyAddress: reportData.config.companyAddress || "",
      remarks: reportData.voucher.remarks || "No additional remarks.",
      itemsList: itemsTableHtml,
    };

    const resolvedSubject = this.replacePlaceholders(template.subject, dict);
    let resolvedBodyHtml = this.replacePlaceholders(template.bodyHtml, dict);

    // Conditional helpers fallback replacement (simple clean up)
    resolvedBodyHtml = resolvedBodyHtml
      .replace(/\{\{#if\s*\([^)]+\)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, (_m, p1, p2) =>
        dict.balanceDue === "0.00" ? p1 : p2
      )
      .replace(/\{\{#if\s*\([^)]+\)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_m, p1) =>
        dict.balanceDue === "0.00" ? p1 : ""
      );

    return {
      templateKey: template.templateKey,
      templateName: template.templateName,
      recipientEmail: dict.customerEmail || "",
      recipientName: dict.customerName,
      subject: resolvedSubject,
      bodyHtml: resolvedBodyHtml,
      attachPdf: template.attachPdf !== false,
      senderName: template.senderName,
      replyTo: template.replyTo,
      cc: template.cc,
      bcc: template.bcc,
      voucherNo: dict.voucherNo,
      grandTotal: dict.grandTotal,
      balanceDue: dict.balanceDue,
    };
  }

  getTransporter(): Transporter | null {
    const host = process.env.SMTP_HOST?.trim();
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();

    if (!host || !user) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false, // Prevents certificate chain issues on internal/cloud relays
      },
    });
  }

  async testSmtpConnection() {
    const host = process.env.SMTP_HOST?.trim();
    const user = process.env.SMTP_USER?.trim();

    if (!host || !user) {
      return {
        configured: false,
        success: false,
        message: "SMTP is not configured. Set SMTP_HOST and SMTP_USER in .env to enable real email transmission.",
      };
    }

    const transporter = this.getTransporter();
    if (!transporter) {
      return {
        configured: false,
        success: false,
        message: "Failed to initialize SMTP transporter. Please check your .env credentials.",
      };
    }

    try {
      await transporter.verify();
      return {
        configured: true,
        success: true,
        message: `SMTP connection verified successfully to ${host}:${process.env.SMTP_PORT || 587}`,
      };
    } catch (err: any) {
      return {
        configured: true,
        success: false,
        message: `SMTP connection failed: ${err?.message || "Unknown error"}`,
      };
    }
  }

  /**
   * Send transaction email via SMTP and record audit logs
   */
  async sendTransactionEmail(payload: SendEmailPayload) {
    const {
      transactionId,
      transactionType = "repairing-bill",
      templateKey = "repairing-bill",
      recipientEmail,
    } = payload;

    if (!recipientEmail || !recipientEmail.includes("@")) {
      throw new Error("A valid recipient email address is required.");
    }

    const template = await this.getTemplate(templateKey);
    const preview = await this.previewTransactionEmail(transactionId, templateKey);
    const finalSubject = payload.subject?.trim() || preview.subject;
    const finalBodyHtml = payload.bodyHtml?.trim() || preview.bodyHtml;
    const shouldAttachPdf =
      payload.attachPdf !== undefined ? payload.attachPdf : preview.attachPdf;

    let pdfAttachmentName = "";
    let pdfBuffer: Buffer | null = null;

    if (shouldAttachPdf) {
      try {
        const { buffer, voucherNo } = await reportService.renderTransactionPdf(transactionId);
        pdfBuffer = buffer;
        pdfAttachmentName = `Invoice-${voucherNo || transactionId}.pdf`;
      } catch (pdfErr) {
        console.warn("[EmailService] Failed generating PDF attachment:", pdfErr);
      }
    }

    // Prepare attachments
    const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
    if (shouldAttachPdf && pdfBuffer) {
      attachments.push({
        filename: pdfAttachmentName || `Invoice-${transactionId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      });
    }

    // Sender details
    const fromName = template.senderName || process.env.SMTP_FROM_NAME || "Matrix ERP";
    const fromEmail =
      process.env.SMTP_FROM_EMAIL ||
      process.env.SMTP_USER ||
      template.replyTo ||
      "noreply@matrixerp.com";
    const fromAddress = `"${fromName}" <${fromEmail}>`;

    const transporter = this.getTransporter();
    let messageId: string | null = null;
    let deliveryMessage = "";

    if (transporter) {
      try {
        console.log(
          `[EmailService] Dispatching SMTP email to: ${recipientEmail} | Subject: "${finalSubject}" | Attachments: ${attachments.length}`
        );

        const mailOptions: SendMailOptions = {
          from: fromAddress,
          to: recipientEmail,
          subject: finalSubject,
          html: finalBodyHtml,
          text: template.bodyText || undefined,
          replyTo: template.replyTo || undefined,
          cc: template.cc
            ? template.cc.split(",").map((e) => e.trim()).filter(Boolean)
            : undefined,
          bcc: template.bcc
            ? template.bcc.split(",").map((e) => e.trim()).filter(Boolean)
            : undefined,
          attachments,
        };

        const info = await transporter.sendMail(mailOptions);
        messageId = info.messageId;
        deliveryMessage = `Email successfully dispatched via SMTP to ${recipientEmail}`;
        console.log(`[EmailService] SMTP delivery successful. MessageId: ${messageId}`);
      } catch (smtpErr: any) {
        console.error("[EmailService] SMTP transmission failed:", smtpErr);
        const errorMsg = smtpErr?.message || "SMTP transmission failure";

        // Log failed attempt
        await db
          .insert(emailLogs)
          .values({
            templateKey,
            transactionId,
            transactionType,
            recipientEmail,
            subject: finalSubject,
            bodyHtml: finalBodyHtml,
            pdfAttached: shouldAttachPdf,
            status: "failed",
            errorMessage: errorMsg,
            addBy: payload.userId || null,
          })
          .catch(() => {});

        throw new Error(`SMTP Mail sending failed: ${errorMsg}`);
      }
    } else {
      console.warn(
        "[EmailService] SMTP credentials not set in .env (SMTP_HOST & SMTP_USER). Simulating successful transmission."
      );
      deliveryMessage = `Email successfully processed (Simulated delivery: Set SMTP_HOST and SMTP_USER in .env for live transmission)`;
    }

    // Record successful dispatch in email_logs
    const [log] = await db
      .insert(emailLogs)
      .values({
        templateKey,
        transactionId,
        transactionType,
        recipientEmail,
        subject: finalSubject,
        bodyHtml: finalBodyHtml,
        pdfAttached: shouldAttachPdf,
        status: "sent",
        errorMessage: null,
        addBy: payload.userId || null,
      })
      .returning();

    return {
      success: true,
      message: deliveryMessage,
      logId: log?.id,
      messageId,
      recipientEmail,
      subject: finalSubject,
      attachedPdf: shouldAttachPdf ? pdfAttachmentName || true : false,
    };
  }

  /**
   * Fetch sent email logs for a transaction
   */
  async getEmailLogsForTransaction(
    transactionId: number,
    _transactionType: string = "repairing-bill"
  ) {
    return await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.transactionId, transactionId))
      .orderBy(desc(emailLogs.sentAt));
  }
}

export const emailService = new EmailService();
