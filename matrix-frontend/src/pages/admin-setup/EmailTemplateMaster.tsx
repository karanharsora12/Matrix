import React, { useEffect, useState, useRef } from "react";
import { ListingCard } from "@/components/common/ListingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Sliders,
  Loader2,
  Smartphone,
  Monitor,
  Copy,
  Paperclip,
  Info,
  Check,
  Server,
  RefreshCw,
} from "lucide-react";
import {
  fetchEmailTemplate,
  saveEmailTemplate,
  resetEmailTemplate,
  checkSmtpStatus,
} from "@/api/email";
import type { EmailTemplateData, PlaceholderInfo, SmtpStatusResponse } from "@/api/email";
import { Modal } from "@/components/common/Modal";

const TRANSACTION_TYPES = [
  { value: "repairing-bill", label: "Repairing Bill Invoice" },
  { value: "repairing-receipt", label: "Repairing Inward Receipt" },
  { value: "sales", label: "Sales Tax Invoice" },
];

const DEFAULT_SAMPLE_DATA: Record<string, string> = {
  customerName: "Rajesh Kumar",
  customerPhone: "+91 98250 12345",
  customerEmail: "rajesh.kumar@example.com",
  voucherNo: "RB-2026-0089",
  voucherDate: "20/10/2026",
  grandTotal: "18,500.00",
  advancePaid: "5,000.00",
  balanceDue: "13,500.00",
  subtotal: "15,000.00",
  taxAmount: "500.00",
  labourAmount: "3,000.00",
  discountAmount: "0.00",
  companyName: "MATRIX JEWELLERS & LUXURY RETAIL",
  companyPhone: "+91 79 2640 9811",
  companyEmail: "support@matrixjewellers.com",
  companyAddress: "402, Matrix Heights, CG Road, Ahmedabad - 380009",
  remarks: "Jewellery serviced and rhodium polished. 6 months craftsmanship warranty.",
  itemsList: `<table width="100%" cellpadding="6" cellspacing="0" style="font-size:12px; border:1px solid #e2e8f0; border-collapse:collapse; margin-top:8px;">
    <thead>
      <tr style="background:#f1f5f9; color:#475569; font-weight:600;">
        <th align="left" style="border:1px solid #e2e8f0; padding:8px;">Item Description</th>
        <th align="center" style="border:1px solid #e2e8f0; padding:8px;">Qty</th>
        <th align="right" style="border:1px solid #e2e8f0; padding:8px;">Weight</th>
        <th align="right" style="border:1px solid #e2e8f0; padding:8px;">Charges (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border:1px solid #e2e8f0; padding:8px;">22K Gold Ring Stone Resetting & Polishing</td>
        <td align="center" style="border:1px solid #e2e8f0; padding:8px;">1</td>
        <td align="right" style="border:1px solid #e2e8f0; padding:8px;">4.850 gm</td>
        <td align="right" style="border:1px solid #e2e8f0; padding:8px;">1,200.00</td>
      </tr>
      <tr style="background:#fcfcfc;">
        <td style="border:1px solid #e2e8f0; padding:8px;">18K Diamond Pendant Laser Soldering</td>
        <td align="center" style="border:1px solid #e2e8f0; padding:8px;">1</td>
        <td align="right" style="border:1px solid #e2e8f0; padding:8px;">2.150 gm</td>
        <td align="right" style="border:1px solid #e2e8f0; padding:8px;">1,800.00</td>
      </tr>
    </tbody>
  </table>`,
};

/**
 * Isolated Email Preview Iframe
 * Prevents HTML/CSS leakages, strips awkward outer white margins,
 * and renders authentic responsive desktop & mobile email viewports.
 */
const EmailPreviewIframe: React.FC<{
  html: string;
  device: "desktop" | "mobile";
}> = ({ html, device }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(680);

  useEffect(() => {
    const handleResize = () => {
      try {
        if (iframeRef.current?.contentDocument?.body) {
          const scrollH = iframeRef.current.contentDocument.body.scrollHeight;
          if (scrollH > 100) {
            setHeight(scrollH + 30);
          }
        }
      } catch {}
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener("load", handleResize);
      const timer = setTimeout(handleResize, 150);
      return () => {
        iframe.removeEventListener("load", handleResize);
        clearTimeout(timer);
      };
    }
  }, [html, device]);

  return (
    <div className="flex justify-center w-full py-4 bg-zinc-100 dark:bg-zinc-950/90 rounded-b-lg border-t border-border">
      <iframe
        ref={iframeRef}
        srcDoc={html}
        title="Live Customer Email Preview"
        className="border-0 rounded-lg shadow-sm transition-all duration-200"
        style={{
          width: device === "mobile" ? "375px" : "660px",
          maxWidth: "100%",
          height: `${height}px`,
          backgroundColor: "#f8fafc",
        }}
        sandbox="allow-same-origin"
      />
    </div>
  );
};

export const EmailTemplateMaster: React.FC = () => {
  const [selectedTxType, setSelectedTxType] = useState<string>("repairing-bill");
  const [activeTab, setActiveTab] = useState<"content" | "routing" | "preview">("content");
  const [template, setTemplate] = useState<EmailTemplateData | null>(null);
  const [placeholders, setPlaceholders] = useState<PlaceholderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatusResponse | null>(null);
  const [testingSmtp, setTestingSmtp] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    try {
      const res = await checkSmtpStatus();
      setSmtpStatus(res);
    } catch (err: any) {
      setSmtpStatus({
        configured: false,
        success: false,
        message: err?.response?.data?.error || err.message || "Failed to connect to backend",
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  // Fetch email template configuration on key change
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setSaveSuccess(false);

    fetchEmailTemplate(selectedTxType)
      .then((data) => {
        setTemplate(data);
        if (data.availablePlaceholders) {
          try {
            setPlaceholders(JSON.parse(data.availablePlaceholders));
          } catch {
            setPlaceholders([]);
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load email template:", err);
        setError("Failed to load email template configuration");
        setIsLoading(false);
      });
  }, [selectedTxType]);

  const updateField = (field: keyof EmailTemplateData, value: any) => {
    setTemplate((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleInsertPlaceholder = (key: string) => {
    const token = `{{${key}}}`;
    if (!textareaRef.current || !template) {
      updateField("bodyHtml", (template?.bodyHtml || "") + token);
      return;
    }

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = template.bodyHtml || "";
    const newVal = currentVal.substring(0, start) + token + currentVal.substring(end);

    updateField("bodyHtml", newVal);

    // Restore cursor position after the inserted tag
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    }, 50);

    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleSave = async () => {
    if (!template) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const saved = await saveEmailTemplate(template);
      setTemplate(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to save email template:", err);
      setError(err?.response?.data?.error || "Failed to save email template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!template) return;
    setIsSaving(true);
    setResetDialogOpen(false);
    setError(null);

    try {
      const reset = await resetEmailTemplate(selectedTxType);
      setTemplate(reset);
      if (reset.availablePlaceholders) {
        try {
          setPlaceholders(JSON.parse(reset.availablePlaceholders));
        } catch {
          setPlaceholders([]);
        }
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to reset email template:", err);
      setError("Failed to reset email template to default");
    } finally {
      setIsSaving(false);
    }
  };

  // Interpolate bodyHtml and subject for live preview
  const renderPreviewHtml = (): string => {
    if (!template?.bodyHtml) return "<p style='color:#888;padding:20px;'>No template content written.</p>";
    let result = template.bodyHtml;
    for (const [key, value] of Object.entries(DEFAULT_SAMPLE_DATA)) {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
    }
    return result;
  };

  const renderPreviewSubject = (): string => {
    if (!template?.subject) return "No Subject";
    let result = template.subject;
    for (const [key, value] of Object.entries(DEFAULT_SAMPLE_DATA)) {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
    }
    return result;
  };

  return (
    <div className="flex h-full flex-col p-4 sm:p-5 space-y-4">
      <ListingCard className="p-4 flex-none shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                Email Template Master
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Design and customize transactional email templates sent automatically or on-demand after transaction saves
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Label htmlFor="txType" className="font-medium text-xs text-muted-foreground whitespace-nowrap">
                Transaction Event:
              </Label>
              <Select value={selectedTxType} onValueChange={(val) => setSelectedTxType(val)}>
                <SelectTrigger id="txType" className="w-[230px] h-8 text-xs font-semibold">
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetDialogOpen(true)}
              disabled={isLoading || isSaving}
              className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
              title="Revert back to system factory email design"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Factory
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={isLoading || isSaving}
              className="h-8 gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </ListingCard>

      {/* Main Content Area Card */}
      <ListingCard className="p-5 flex-1 overflow-auto shadow-xs">
        <div className="space-y-5">
          {/* Status Alerts */}
          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Email template saved and synchronized successfully!</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium">
                Loading email template configuration...
              </p>
            </div>
          ) : !template ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <Mail className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium">No template found for selected transaction.</p>
            </div>
          ) : (
            <div>
              {/* Navigation Tabs */}
              <div className="flex border-b text-xs font-medium text-muted-foreground">
                <button
                  type="button"
                  onClick={() => setActiveTab("content")}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 transition-colors ${
                    activeTab === "content"
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent hover:text-foreground"
                  }`}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  HTML Body & Placeholders
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("routing")}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 transition-colors ${
                    activeTab === "routing"
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent hover:text-foreground"
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5" />
                  Subject & Sender Settings
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 transition-colors ${
                    activeTab === "preview"
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent hover:text-foreground"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Live Customer Preview
                </button>
              </div>

              {/* TAB 1: HTML Body & Placeholders */}
              {activeTab === "content" && (
                <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {/* Left 8 Cols: HTML Editor */}
                  <div className="space-y-4 lg:col-span-8">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="subjectInput" className="text-xs font-semibold">
                          Subject Line
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          Supports placeholder variables
                        </span>
                      </div>
                      <Input
                        id="subjectInput"
                        value={template.subject || ""}
                        onChange={(e) => updateField("subject", e.target.value)}
                        placeholder="e.g. Invoice for Repairing Bill {{voucherNo}} - {{companyName}}"
                        className="text-xs font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="bodyHtml" className="text-xs font-semibold">
                          Email HTML Layout Template
                        </Label>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Valid HTML5 & Inline Styles
                        </span>
                      </div>
                      <textarea
                        ref={textareaRef}
                        id="bodyHtml"
                        rows={22}
                        value={template.bodyHtml || ""}
                        onChange={(e) => updateField("bodyHtml", e.target.value)}
                        placeholder="Enter raw HTML email template code..."
                        className="w-full rounded-md border border-input bg-zinc-950 p-3 font-mono text-[11px] text-zinc-100 leading-relaxed shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="bodyText" className="text-xs font-semibold text-muted-foreground">
                        Optional Plain Text Fallback
                      </Label>
                      <textarea
                        id="bodyText"
                        rows={3}
                        value={template.bodyText || ""}
                        onChange={(e) => updateField("bodyText", e.target.value)}
                        placeholder="Plain-text version for non-HTML mail readers..."
                        className="w-full rounded-md border border-input bg-background p-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                  </div>

                  {/* Right 4 Cols: Dynamic Placeholder Tags Directory */}
                  <div className="space-y-4 lg:col-span-4">
                    <div className="rounded-lg border bg-muted/20 p-4 shadow-2xs">
                      <div className="flex items-center gap-2 mb-2">
                        <FileCode className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Variable Placeholders
                        </h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                        Click any tag to insert it directly into your HTML template at current cursor position.
                      </p>

                      <div className="flex flex-col gap-1.5 max-h-[540px] overflow-y-auto pr-1">
                        {placeholders.map((p) => {
                          const isCopied = copiedKey === p.key;
                          return (
                            <div
                              key={p.key}
                              onClick={() => handleInsertPlaceholder(p.key)}
                              className="group flex cursor-pointer items-center justify-between rounded-md border border-border bg-background p-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                              title={`Click to insert {{${p.key}}}`}
                            >
                              <div className="flex flex-col min-w-0 pr-2">
                                <span className="font-mono text-[11px] font-semibold text-primary truncate">
                                  {`{{${p.key}}}`}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate">
                                  {p.label}
                                </span>
                              </div>
                              <div className="shrink-0 flex items-center">
                                {isCopied ? (
                                  <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    <Check className="h-3 w-3" /> Inserted
                                  </span>
                                ) : (
                                  <Copy className="h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:text-primary transition-opacity" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20 p-3 text-xs text-blue-900 dark:text-blue-300">
                      <div className="flex items-center gap-1.5 font-semibold mb-1">
                        <Info className="h-3.5 w-3.5" />
                        Tip on Invoices
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Using <code className="font-mono bg-blue-100 dark:bg-blue-900/50 px-1 rounded">{"{{itemsList}}"}</code> automatically outputs a clean HTML table displaying the transaction lines, weights, and charges.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Routing & Sender Settings */}
              {activeTab === "routing" && (
                <div className="mt-5 max-w-2xl space-y-5">
                  {/* SMTP Server Live Status Banner */}
                  <div className="rounded-lg border bg-muted/20 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                          SMTP Mail Server Connection
                        </h4>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTestSmtp}
                        disabled={testingSmtp}
                        className="h-7 gap-1.5 text-[11px]"
                      >
                        <RefreshCw className={`h-3 w-3 ${testingSmtp ? "animate-spin" : ""}`} />
                        {testingSmtp ? "Testing..." : "Test Connection"}
                      </Button>
                    </div>

                    {smtpStatus ? (
                      <div
                        className={`flex items-start gap-2 rounded-md p-2.5 text-xs ${
                          smtpStatus.success
                            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {smtpStatus.success ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        )}
                        <div className="text-[11px] leading-relaxed">
                          <p className="font-semibold">{smtpStatus.message}</p>
                          {!smtpStatus.success && (
                            <p className="mt-1 opacity-90">
                              To send real customer emails, add <code>SMTP_HOST</code>, <code>SMTP_USER</code>, and <code>SMTP_PASS</code> in your backend <code>.env</code> file.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Emails are dispatched through the organization's SMTP server configured in the backend environment (e.g. Gmail, Office 365, Mailgun, or custom host). Click <strong>Test Connection</strong> to verify live status.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="templateName" className="text-xs font-semibold">
                      Template Title / Reference Name
                    </Label>
                    <Input
                      id="templateName"
                      value={template.templateName || ""}
                      onChange={(e) => updateField("templateName", e.target.value)}
                      placeholder="e.g. Repairing Bill Customer Dispatch"
                      className="text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Internal label shown in settings and selection lists.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="senderName" className="text-xs font-semibold">
                        Sender Name (From Name)
                      </Label>
                      <Input
                        id="senderName"
                        value={template.senderName || ""}
                        onChange={(e) => updateField("senderName", e.target.value)}
                        placeholder="e.g. Matrix Jewellers"
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="replyTo" className="text-xs font-semibold">
                        Reply-To Email Address
                      </Label>
                      <Input
                        id="replyTo"
                        value={template.replyTo || ""}
                        onChange={(e) => updateField("replyTo", e.target.value)}
                        placeholder="e.g. support@matrixjewellers.com"
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="ccEmail" className="text-xs font-semibold">
                        Carbon Copy (CC)
                      </Label>
                      <Input
                        id="ccEmail"
                        value={template.cc || ""}
                        onChange={(e) => updateField("cc", e.target.value)}
                        placeholder="e.g. accounts@store.com, manager@store.com"
                        className="text-xs"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Comma-separated email addresses to CC automatically.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="bccEmail" className="text-xs font-semibold">
                        Blind Carbon Copy (BCC)
                      </Label>
                      <Input
                        id="bccEmail"
                        value={template.bcc || ""}
                        onChange={(e) => updateField("bcc", e.target.value)}
                        placeholder="e.g. audit-archive@store.com"
                        className="text-xs"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Secret archive email address for transaction audit copies.
                      </p>
                    </div>
                  </div>

                  {/* PDF Attachment Toggle */}
                  <div className="rounded-lg border bg-muted/10 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="attachPdf"
                        checked={template.attachPdf ?? true}
                        onChange={(e) =>
                          updateField("attachPdf", Boolean(e.target.checked))
                        }
                        className="mt-0.5"
                      />
                      <div className="space-y-1">
                        <Label
                          htmlFor="attachPdf"
                          className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5"
                        >
                          <Paperclip className="h-3.5 w-3.5 text-primary" />
                          Attach Official Generated PDF Invoice
                        </Label>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          When enabled, sending an email renders the transaction PDF using your Print Setup layout and attaches the PDF document (e.g. <code>Invoice-RB-2026-0042.pdf</code>) directly to the outgoing email.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center gap-3 pt-2">
                    <Checkbox
                      id="isActive"
                      checked={template.isActive ?? true}
                      onChange={(e) =>
                        updateField("isActive", Boolean(e.target.checked))
                      }
                    />
                    <Label htmlFor="isActive" className="text-xs font-medium cursor-pointer">
                      Enable this template for automated & manual transaction dispatches
                    </Label>
                  </div>
                </div>
              )}

              {/* TAB 3: Live Customer Preview */}
              {activeTab === "preview" && (
                <div className="mt-5 space-y-4">
                  {/* Viewport & Device Controls */}
                  <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <span>Rendering Viewport:</span>
                      <div className="flex rounded-md border bg-background p-0.5">
                        <Button
                          type="button"
                          variant={previewDevice === "desktop" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setPreviewDevice("desktop")}
                          className="h-6 gap-1 px-2 text-[11px]"
                        >
                          <Monitor className="h-3 w-3" /> Desktop
                        </Button>
                        <Button
                          type="button"
                          variant={previewDevice === "mobile" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setPreviewDevice("mobile")}
                          className="h-6 gap-1 px-2 text-[11px]"
                        >
                          <Smartphone className="h-3 w-3" /> Mobile
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Mail Client Shell Mockup */}
                  <div className="mx-auto flex flex-col rounded-lg border shadow-sm bg-background overflow-hidden max-w-[780px]">
                    {/* Fake Mail Client Header */}
                    <div className="border-b bg-muted/40 p-4 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {template.senderName || "Store Name"}
                          </span>
                          <span className="text-muted-foreground font-mono text-[11px]">
                            &lt;{template.replyTo || "no-reply@store.com"}&gt;
                          </span>
                        </div>
                        {template.attachPdf && (
                          <div className="flex items-center gap-1 rounded bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-foreground">
                            <Paperclip className="h-3 w-3 text-primary" />
                            <span>Invoice-{DEFAULT_SAMPLE_DATA.voucherNo}.pdf (Attached)</span>
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">To: </span>
                        {DEFAULT_SAMPLE_DATA.customerName} &lt;{DEFAULT_SAMPLE_DATA.customerEmail}&gt;
                      </div>
                      <div className="pt-1 text-sm font-bold text-foreground">
                        {renderPreviewSubject()}
                      </div>
                    </div>

                    {/* Isolated Sandboxed Iframe (No CSS clash, no outer white border) */}
                    <EmailPreviewIframe
                      html={renderPreviewHtml()}
                      device={previewDevice}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ListingCard>

      {/* Reset Confirmation Modal */}
      <Modal
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title="Reset Email Template to Default?"
        description="This will restore the factory default HTML design, styling, and placeholders for this transaction event. Any customized HTML edits will be replaced."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleResetToDefault}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Confirm Reset
            </Button>
          </div>
        }
      >
        <p className="text-xs text-muted-foreground">
          Are you sure you want to reset <strong>{template?.templateName || selectedTxType}</strong>? You can preview the factory layout immediately after resetting.
        </p>
      </Modal>
    </div>
  );
};

export default EmailTemplateMaster;
