import React, { useEffect, useState } from "react";
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
  Printer,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sliders,
  Building,
  Table,
  ShieldAlert,
  Loader2,
  Code,
  ZoomIn,
  ZoomOut,
  FileCheck,
} from "lucide-react";
import {
  fetchPrintConfig,
  savePrintConfig,
  resetPrintConfig,
  fetchSampleHtml,
} from "@/api/report";
import type { PrintConfigData } from "@/api/report";
import { Modal } from "@/components/common/Modal";

const TRANSACTION_TYPES = [
  { value: "repairing-bill", label: "Repairing Bill" },
  { value: "sales", label: "Sales Tax Invoice" },
  { value: "purchase", label: "Purchase Tax Invoice" },
];

const InvoicePaperShadowHost: React.FC<{ html: string }> = ({ html }) => {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const shadowRootRef = React.useRef<ShadowRoot | null>(null);

  React.useEffect(() => {
    if (!hostRef.current) return;
    if (!shadowRootRef.current) {
      shadowRootRef.current = hostRef.current.attachShadow({ mode: "open" });
    }
    shadowRootRef.current.innerHTML = html;
  }, [html]);

  return <div ref={hostRef} className="w-full overflow-hidden" />;
};

export const PrintSetup: React.FC = () => {
  const [selectedTxType, setSelectedTxType] =
    useState<string>("repairing-bill");
  const [activeTab, setActiveTab] = useState<
    "layout" | "branding" | "columns" | "totals" | "terms" | "advanced"
  >("layout");
  const [config, setConfig] = useState<PrintConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sample preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sampleHtml, setSampleHtml] = useState<string | null>(null);
  const [sampleZoom, setSampleZoom] = useState<number>(100);

  // Fetch config whenever transaction type changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setSaveSuccess(false);

    fetchPrintConfig(selectedTxType)
      .then((data) => {
        setConfig(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load print config:", err);
        setError("Failed to load configuration");
        setIsLoading(false);
      });
  }, [selectedTxType]);

  const updateField = (field: keyof PrintConfigData, value: any) => {
    setConfig((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const saved = await savePrintConfig(config);
      setConfig(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to save config:", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to save configuration",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Reset all settings for this transaction type to system defaults?",
      )
    ) {
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const reset = await resetPrintConfig(selectedTxType);
      setConfig(reset);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to reset config:", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to reset configuration",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPreview = async () => {
    if (!config) return;
    setPreviewOpen(true);
    setPreviewLoading(true);

    try {
      const html = await fetchSampleHtml(config);
      setSampleHtml(html);
    } catch (err: any) {
      console.error("Failed to generate sample preview:", err);
      setError("Failed to generate sample preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  if (isLoading || !config) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading Print Configuration...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4 space-y-4">
      {/* Top Header */}
      <ListingCard className="p-4 flex-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              Invoice & Report Print Setup
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Module:</Label>
              <Select value={selectedTxType} onValueChange={setSelectedTxType}>
                <SelectTrigger className="w-[180px] h-8 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((t) => (
                    <SelectItem
                      key={t.value}
                      value={t.value}
                      className="text-xs"
                    >
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenPreview}
              className="h-8 gap-1.5 text-xs"
            >
              <Eye className="h-3.5 w-3.5" />
              Live Preview
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSaving}
              className="h-8 gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Defaults
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 gap-1.5 text-xs bg-primary-action text-primary-action-foreground font-semibold"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save Settings
            </Button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Print configuration saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </ListingCard>

      {/* Tabs and Form Content */}
      <ListingCard className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-border bg-muted/30 px-4 pt-2 gap-1 overflow-x-auto">
          {[
            { key: "layout", label: "Page & Behavior", icon: Sliders },
            { key: "branding", label: "Company & Header", icon: Building },
            { key: "columns", label: "Table Columns", icon: Table },
            { key: "totals", label: "Totals & Tax", icon: FileText },
            { key: "terms", label: "Terms & Signatures", icon: ShieldAlert },
            { key: "advanced", label: "Custom Handlebars", icon: Code },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-md transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  isActive
                    ? "border-primary text-primary bg-background shadow-xs"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* 1. Page & Behavior */}
          {activeTab === "layout" && (
            <div className="max-w-3xl space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">
                    Default Post-Save Action
                  </Label>
                  <p className="text-[11px] text-muted-foreground mb-1.5">
                    What happens immediately after successfully saving a
                    transaction.
                  </p>
                  <Select
                    value={config.defaultPostSaveAction || "preview"}
                    onValueChange={(val) =>
                      updateField("defaultPostSaveAction", val)
                    }
                  >
                    <SelectTrigger className="h-8 text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preview" className="text-xs">
                        Save & Preview (Recommended)
                      </SelectItem>
                      <SelectItem value="print" className="text-xs">
                        Save & Direct Print
                      </SelectItem>
                      <SelectItem value="none" className="text-xs">
                        Save Only (No print prompt)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Paper Size</Label>
                  <p className="text-[11px] text-muted-foreground mb-1.5">
                    Standard printer format for invoices.
                  </p>
                  <Select
                    value={config.paperSize || "A4"}
                    onValueChange={(val) => updateField("paperSize", val)}
                  >
                    <SelectTrigger className="h-8 text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4" className="text-xs">
                        A4 (210 × 297 mm)
                      </SelectItem>
                      <SelectItem value="A5" className="text-xs">
                        A5 (148 × 210 mm - Compact)
                      </SelectItem>
                      <SelectItem value="Letter" className="text-xs">
                        US Letter
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Orientation</Label>
                  <Select
                    value={config.orientation || "portrait"}
                    onValueChange={(val) => updateField("orientation", val)}
                  >
                    <SelectTrigger className="h-8 text-xs font-medium mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait" className="text-xs">
                        Portrait (Vertical)
                      </SelectItem>
                      <SelectItem value="landscape" className="text-xs">
                        Landscape (Horizontal)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    Number of Copies
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={config.copies || 1}
                    onChange={(e) =>
                      updateField("copies", parseInt(e.target.value, 10) || 1)
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <Label className="text-xs font-semibold">
                  Page Margins (e.g. 10mm or 8mm)
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">
                      Top
                    </Label>
                    <Input
                      value={config.marginTop || "10mm"}
                      onChange={(e) => updateField("marginTop", e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">
                      Bottom
                    </Label>
                    <Input
                      value={config.marginBottom || "10mm"}
                      onChange={(e) =>
                        updateField("marginBottom", e.target.value)
                      }
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">
                      Left
                    </Label>
                    <Input
                      value={config.marginLeft || "10mm"}
                      onChange={(e) =>
                        updateField("marginLeft", e.target.value)
                      }
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">
                      Right
                    </Label>
                    <Input
                      value={config.marginRight || "10mm"}
                      onChange={(e) =>
                        updateField("marginRight", e.target.value)
                      }
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Company & Header */}
          {activeTab === "branding" && (
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-4 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showHeader"
                    checked={config.showHeader}
                    onChange={(e) =>
                      updateField("showHeader", Boolean(e.target.value))
                    }
                  />
                  <Label
                    htmlFor="showHeader"
                    className="text-xs font-semibold cursor-pointer"
                  >
                    Show Header & Company Info
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showLogo"
                    checked={config.showLogo}
                    onChange={(e) =>
                      updateField("showLogo", Boolean(e.target.value))
                    }
                  />
                  <Label
                    htmlFor="showLogo"
                    className="text-xs font-semibold cursor-pointer"
                  >
                    Show Company Logo
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label className="text-xs font-semibold">Company Name</Label>
                  <Input
                    value={config.companyName || ""}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs font-semibold">
                    Company Address
                  </Label>
                  <Input
                    value={config.companyAddress || ""}
                    onChange={(e) =>
                      updateField("companyAddress", e.target.value)
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    Company Phone / Mobile
                  </Label>
                  <Input
                    value={config.companyPhone || ""}
                    onChange={(e) =>
                      updateField("companyPhone", e.target.value)
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Company Email</Label>
                  <Input
                    value={config.companyEmail || ""}
                    onChange={(e) =>
                      updateField("companyEmail", e.target.value)
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">GSTIN</Label>
                  <Input
                    value={config.companyGstin || ""}
                    onChange={(e) =>
                      updateField("companyGstin", e.target.value)
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">PAN</Label>
                  <Input
                    value={config.companyPan || ""}
                    onChange={(e) => updateField("companyPan", e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    Document Title
                  </Label>
                  <Input
                    value={config.headerTitle || ""}
                    onChange={(e) => updateField("headerTitle", e.target.value)}
                    className="h-8 text-xs mt-1"
                    placeholder="e.g. REPAIRING BILL / TAX INVOICE"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    Document Subtitle
                  </Label>
                  <Input
                    value={config.headerSubtitle || ""}
                    onChange={(e) =>
                      updateField("headerSubtitle", e.target.value)
                    }
                    className="h-8 text-xs mt-1"
                    placeholder="e.g. Original for Recipient"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs font-semibold">
                    Company Logo URL / Base64
                  </Label>
                  <Input
                    value={config.logoUrl || ""}
                    onChange={(e) => updateField("logoUrl", e.target.value)}
                    className="h-8 text-xs mt-1"
                    placeholder="https://... or data:image/png;base64,..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Table Columns */}
          {activeTab === "columns" && (
            <div className="max-w-2xl space-y-4">
              <div>
                <h4 className="text-xs font-bold text-foreground">
                  Customer & Voucher Sections
                </h4>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showCustomerDetails"
                      checked={config.showCustomerDetails}
                      onChange={(e) =>
                        updateField(
                          "showCustomerDetails",
                          Boolean(e.target.value),
                        )
                      }
                    />
                    <Label
                      htmlFor="showCustomerDetails"
                      className="text-xs cursor-pointer"
                    >
                      Customer / Party Details (Name, Phone, Address, GST)
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showVoucherDetails"
                      checked={config.showVoucherDetails}
                      onChange={(e) =>
                        updateField(
                          "showVoucherDetails",
                          Boolean(e.target.value),
                        )
                      }
                    />
                    <Label
                      htmlFor="showVoucherDetails"
                      className="text-xs cursor-pointer"
                    >
                      Voucher Details (Bill No, Date, Daybook, Ref No)
                    </Label>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="text-xs font-bold text-foreground">
                  Item Lines Table Columns
                </h4>
                <p className="text-[11px] text-muted-foreground mb-3">
                  Select which columns appear on the printed invoice table.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: "showItemDescription", label: "Item Description" },
                    { id: "showItemCode", label: "Item Code / Tag" },
                    { id: "showGrossWeight", label: "Gross Weight (g)" },
                    { id: "showNetWeight", label: "Net Weight (g)" },
                    { id: "showQuantity", label: "Quantity (Qty)" },
                    { id: "showLabour", label: "Labour Amount (₹)" },
                    { id: "showRate", label: "Rate (₹)" },
                    { id: "showDiscount", label: "Discount (₹)" },
                    { id: "showTax", label: "Tax Rate (%)" },
                    { id: "showAmount", label: "Total Amount (₹)" },
                  ].map((col) => (
                    <div key={col.id} className="flex items-center gap-2">
                      <Checkbox
                        id={col.id}
                        checked={(config as any)[col.id]}
                        onChange={(e) =>
                          updateField(col.id as any, Boolean(e.target.value))
                        }
                      />
                      <Label
                        htmlFor={col.id}
                        className="text-xs cursor-pointer"
                      >
                        {col.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. Totals & Tax */}
          {activeTab === "totals" && (
            <div className="max-w-2xl space-y-4">
              <h4 className="text-xs font-bold text-foreground">
                Tax & Valuation Sections
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showTaxSummary"
                    checked={config.showTaxSummary}
                    onChange={(e) =>
                      updateField("showTaxSummary", Boolean(e.target.value))
                    }
                  />
                  <Label
                    htmlFor="showTaxSummary"
                    className="text-xs cursor-pointer"
                  >
                    Tax Breakdown (Taxable, CGST, SGST)
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showPaymentSummary"
                    checked={config.showPaymentSummary}
                    onChange={(e) =>
                      updateField("showPaymentSummary", Boolean(e.target.value))
                    }
                  />
                  <Label
                    htmlFor="showPaymentSummary"
                    className="text-xs cursor-pointer"
                  >
                    Show Payment & Settlement
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showAdvancePaid"
                    checked={config.showAdvancePaid}
                    onChange={(e) =>
                      updateField("showAdvancePaid", Boolean(e.target.value))
                    }
                  />
                  <Label
                    htmlFor="showAdvancePaid"
                    className="text-xs cursor-pointer"
                  >
                    Show Advance / Paid Amount
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showBalanceDue"
                    checked={config.showBalanceDue}
                    onChange={(e) =>
                      updateField("showBalanceDue", Boolean(e.target.value))
                    }
                  />
                  <Label
                    htmlFor="showBalanceDue"
                    className="text-xs cursor-pointer"
                  >
                    Show Balance Due Amount
                  </Label>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    id="showFooter"
                    checked={config.showFooter}
                    onChange={(e) =>
                      updateField("showFooter", Boolean(e.target.value))
                    }
                  />
                  <Label
                    htmlFor="showFooter"
                    className="text-xs font-semibold cursor-pointer"
                  >
                    Show Invoice Footer
                  </Label>
                </div>

                <Label className="text-xs font-semibold">
                  Footer Note Text
                </Label>
                <Input
                  value={config.footerText || ""}
                  onChange={(e) => updateField("footerText", e.target.value)}
                  className="h-8 text-xs mt-1"
                  placeholder="e.g. Thank you for your business."
                />
              </div>
            </div>
          )}

          {/* 5. Terms & Signatures */}
          {activeTab === "terms" && (
            <div className="max-w-3xl space-y-4">
              <div>
                <Label className="text-xs font-semibold">
                  Terms and Conditions
                </Label>
                <p className="text-[11px] text-muted-foreground mb-1.5">
                  Appears below the summary table. Each line is displayed as a
                  condition.
                </p>
                <textarea
                  rows={5}
                  value={config.termsAndConditions || ""}
                  onChange={(e) =>
                    updateField("termsAndConditions", e.target.value)
                  }
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="text-xs font-bold text-foreground">
                  Signatures
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showCustomerSignature"
                      checked={config.showCustomerSignature}
                      onChange={(e) =>
                        updateField(
                          "showCustomerSignature",
                          Boolean(e.target.value),
                        )
                      }
                    />
                    <Label
                      htmlFor="showCustomerSignature"
                      className="text-xs cursor-pointer"
                    >
                      Show Customer Signature Block
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="showAuthorizedSignature"
                      checked={config.showAuthorizedSignature}
                      onChange={(e) =>
                        updateField(
                          "showAuthorizedSignature",
                          Boolean(e.target.value),
                        )
                      }
                    />
                    <Label
                      htmlFor="showAuthorizedSignature"
                      className="text-xs cursor-pointer"
                    >
                      Show Authorized Signatory Block
                    </Label>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">
                      Authorized Signature Label
                    </Label>
                    <Input
                      value={config.signatureLabel || ""}
                      onChange={(e) =>
                        updateField("signatureLabel", e.target.value)
                      }
                      className="h-8 text-xs mt-1"
                      placeholder="e.g. Authorized Signatory / For Matrix Jewellers"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. Advanced Custom Handlebars & CSS */}
          {activeTab === "advanced" && (
            <div className="max-w-4xl space-y-4">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300">
                <span className="font-semibold">
                  Advanced Template Customization:
                </span>{" "}
                Leave blank to use the built-in responsive jsreport template.
                You can supply custom Handlebars HTML or CSS here to override
                the layout.
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-semibold">
                    Custom CSS Overrides
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px]"
                    onClick={() => updateField("customTemplateCss", "")}
                  >
                    Clear CSS
                  </Button>
                </div>
                <textarea
                  rows={4}
                  value={config.customTemplateCss || ""}
                  onChange={(e) =>
                    updateField("customTemplateCss", e.target.value)
                  }
                  placeholder="e.g. .company-title { color: #b45309; }"
                  className="w-full font-mono rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-semibold">
                    Custom Handlebars HTML Template
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px]"
                    onClick={() => updateField("customTemplateHtml", "")}
                  >
                    Clear HTML (Restore Standard)
                  </Button>
                </div>
                <textarea
                  rows={8}
                  value={config.customTemplateHtml || ""}
                  onChange={(e) =>
                    updateField("customTemplateHtml", e.target.value)
                  }
                  placeholder="Leave empty to use standard template with the toggles above."
                  className="w-full font-mono rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          )}
        </div>
      </ListingCard>

      {/* Live Sample Preview Modal */}
      <Modal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="Live Invoice Print Preview"
        description="Sample preview generated using current settings and jsreport engine."
        width="3xl"
        footer={
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-1 rounded-md border border-input bg-background p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => setSampleZoom((z) => Math.max(z - 15, 65))}
                disabled={sampleZoom <= 65}
                title="Zoom Out"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="w-10 text-center font-mono text-[11px] font-semibold text-muted-foreground">
                {sampleZoom}%
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => setSampleZoom((z) => Math.min(z + 15, 145))}
                disabled={sampleZoom >= 145}
                title="Zoom In"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPreviewOpen(false)}
            >
              Close
            </Button>
          </div>
        }
      >
        <div className="relative flex min-h-[460px] max-h-[70vh] w-full flex-col items-center justify-start overflow-y-auto overflow-x-hidden rounded-lg bg-zinc-100 p-4 sm:p-6 dark:bg-zinc-950/80 border border-border">
          {previewLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">
                Rendering sample preview...
              </p>
            </div>
          )}

          {sampleHtml && !previewLoading && (
            <div
              className="flex flex-col items-center w-full transition-transform duration-150 ease-out"
              style={{
                transform:
                  sampleZoom !== 100 ? `scale(${sampleZoom / 100})` : undefined,
                transformOrigin: "top center",
              }}
            >
              <div className="w-full max-w-[700px] rounded-md bg-white p-5 sm:p-7 shadow-xl border border-zinc-200 dark:border-zinc-800 text-zinc-900">
                <div className="mb-2 flex items-center justify-between border-b border-zinc-100 pb-1.5 text-[10px] text-zinc-400 select-none">
                  <span className="flex items-center gap-1 font-medium">
                    <FileCheck className="h-3 w-3 text-emerald-600" />
                    Live Print Setup Sample Sheet
                  </span>
                  <span>
                    Paper: {config.paperSize} ({config.orientation})
                  </span>
                </div>

                <InvoicePaperShadowHost html={sampleHtml} />
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PrintSetup;
