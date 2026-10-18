import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import { printConfigurations } from "../db/schema";

export interface PrintConfigData {
  id?: number;
  transactionType: string;
  templateKey?: string;
  templateName?: string;
  isDefault?: boolean;
  paperSize?: string;
  orientation?: string;
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyGstin?: string | null;
  companyPan?: string | null;
  logoUrl?: string | null;
  showHeader?: boolean;
  showFooter?: boolean;
  showLogo?: boolean;
  headerTitle?: string | null;
  headerSubtitle?: string | null;
  footerText?: string | null;
  showCustomerDetails?: boolean;
  showVoucherDetails?: boolean;
  showItemCode?: boolean;
  showItemDescription?: boolean;
  showLabour?: boolean;
  showRate?: boolean;
  showQuantity?: boolean;
  showDiscount?: boolean;
  showTax?: boolean;
  showAmount?: boolean;
  showTaxSummary?: boolean;
  showPaymentSummary?: boolean;
  showAdvancePaid?: boolean;
  showBalanceDue?: boolean;
  termsAndConditions?: string | null;
  showAuthorizedSignature?: boolean;
  showCustomerSignature?: boolean;
  signatureLabel?: string | null;
  defaultPostSaveAction?: string; // 'preview' | 'print' | 'none'
  copies?: number;
  customTemplateHtml?: string | null;
  customTemplateCss?: string | null;
  isActive?: boolean;
}

const DEFAULT_COMPANY = {
  companyName: "MATRIX JEWELLERS & LUXURY RETAIL",
  companyAddress: "402, Matrix Heights, CG Road, Navrangpura, Ahmedabad - 380009",
  companyPhone: "+91 79 2640 9811",
  companyEmail: "info@matrixjewellers.com",
  companyGstin: "24AAACM4901P1Z8",
  companyPan: "AAACM4901P",
};

const DEFAULT_TERMS = `1. Goods received for repair are at owner's risk regarding stone cracking or unforeseen manufacturing defects during heating.
2. Estimated delivery time is approximate and subject to craftsman availability.
3. Repaired articles must be collected within 30 days of notification with original repair receipt.
4. Any dispute is subject to local jurisdiction only.`;

export class PrintConfigService {
  /**
   * Get default fallback config object for when no DB record exists
   */
  getDefaultConfigObject(transactionType: string): PrintConfigData {
    const isRepair = transactionType === "repairing-bill" || transactionType === "repairing-receipt";
    return {
      transactionType,
      templateKey: "default",
      templateName: isRepair ? "Repairing Bill Standard" : "Standard Tax Invoice",
      isDefault: true,
      paperSize: "A4",
      orientation: "portrait",
      marginTop: "10mm",
      marginBottom: "10mm",
      marginLeft: "10mm",
      marginRight: "10mm",
      ...DEFAULT_COMPANY,
      showHeader: true,
      showFooter: true,
      showLogo: true,
      headerTitle: isRepair ? "REPAIRING BILL / TAX INVOICE" : "TAX INVOICE",
      headerSubtitle: "Original for Recipient",
      footerText: "Thank you for trusting Matrix Jewellers.",
      showCustomerDetails: true,
      showVoucherDetails: true,
      showItemCode: true,
      showItemDescription: true,
      showLabour: true,
      showRate: true,
      showQuantity: true,
      showDiscount: true,
      showTax: true,
      showAmount: true,
      showTaxSummary: true,
      showPaymentSummary: true,
      showAdvancePaid: true,
      showBalanceDue: true,
      termsAndConditions: DEFAULT_TERMS,
      showAuthorizedSignature: true,
      showCustomerSignature: true,
      signatureLabel: "Authorized Signatory",
      defaultPostSaveAction: "preview",
      copies: 1,
      isActive: true,
    };
  }

  /**
   * Get active config for a transaction type and optional templateKey
   */
  async getConfig(transactionType: string, templateKey?: string): Promise<PrintConfigData> {
    const conditions = [
      eq(printConfigurations.transactionType, transactionType),
      eq(printConfigurations.isActive, true),
    ];

    if (templateKey) {
      conditions.push(eq(printConfigurations.templateKey, templateKey));
    } else {
      conditions.push(eq(printConfigurations.isDefault, true));
    }

    const rows = await db
      .select()
      .from(printConfigurations)
      .where(and(...conditions))
      .limit(1);

    if (rows.length > 0) {
      return rows[0] as PrintConfigData;
    }

    // Fallback: check any active config for this transaction type
    const anyConfig = await db
      .select()
      .from(printConfigurations)
      .where(
        and(
          eq(printConfigurations.transactionType, transactionType),
          eq(printConfigurations.isActive, true)
        )
      )
      .limit(1);

    if (anyConfig.length > 0) {
      return anyConfig[0] as PrintConfigData;
    }

    // Fallback to default in-memory configuration
    return this.getDefaultConfigObject(transactionType);
  }

  /**
   * Get all configs, optionally filtered by transactionType
   */
  async getAllConfigs(transactionType?: string) {
    if (transactionType) {
      return await db
        .select()
        .from(printConfigurations)
        .where(eq(printConfigurations.transactionType, transactionType))
        .orderBy(desc(printConfigurations.isDefault), printConfigurations.id);
    }
    return await db
      .select()
      .from(printConfigurations)
      .orderBy(printConfigurations.transactionType, desc(printConfigurations.isDefault), printConfigurations.id);
  }

  /**
   * Get config by primary key
   */
  async getConfigById(id: number) {
    const [config] = await db
      .select()
      .from(printConfigurations)
      .where(eq(printConfigurations.id, id));
    return config || null;
  }

  /**
   * Create or update print configuration
   */
  async saveConfig(data: PrintConfigData) {
    const { id, ...configData } = data;

    if (configData.isDefault && configData.transactionType) {
      // If setting this one as default, unset other defaults for the same transaction type
      await db
        .update(printConfigurations)
        .set({ isDefault: false })
        .where(eq(printConfigurations.transactionType, configData.transactionType));
    }

    if (id) {
      const [updated] = await db
        .update(printConfigurations)
        .set({
          ...configData,
          updatedAt: new Date(),
        })
        .where(eq(printConfigurations.id, id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(printConfigurations)
        .values({
          ...configData,
          transactionType: configData.transactionType || "repairing-bill",
        } as any)
        .returning();
      return created;
    }
  }

  /**
   * Reset configuration to default values
   */
  async resetToDefault(transactionType: string) {
    const defaultConfig = this.getDefaultConfigObject(transactionType);
    
    // Check if one already exists
    const existing = await db
      .select()
      .from(printConfigurations)
      .where(
        and(
          eq(printConfigurations.transactionType, transactionType),
          eq(printConfigurations.isDefault, true)
        )
      )
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      return await this.saveConfig({
        ...defaultConfig,
        id: existing[0].id,
      });
    }

    return await this.saveConfig(defaultConfig);
  }
}

export const printConfigService = new PrintConfigService();
