import type { Request, Response } from "express";
import { reportService } from "../services/report.service";
import { printConfigService } from "../services/print-config.service";

export class ReportController {
  async getTransactionPdf(req: Request, res: Response) {
    try {
      const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const id = parseInt(idStr || "", 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid transaction ID" });
      }

      const templateKey = req.query.templateKey as string | undefined;
      let configOverride;
      if (templateKey) {
        configOverride = { templateKey };
      }

      const { buffer, voucherNo } = await reportService.renderTransactionPdf(id, configOverride);

      const disposition = (req.query.disposition as string) === "attachment" ? "attachment" : "inline";
      const filename = `Invoice-${voucherNo.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
      return res.send(buffer);
    } catch (error: any) {
      console.error("Error generating transaction PDF:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to generate invoice PDF",
      });
    }
  }

  async getTransactionHtml(req: Request, res: Response) {
    try {
      const idStr = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const id = parseInt(idStr || "", 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid transaction ID" });
      }

      const html = await reportService.renderTransactionHtml(id);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    } catch (error: any) {
      console.error("Error generating transaction HTML:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to render invoice preview",
      });
    }
  }

  async getSamplePdf(req: Request, res: Response) {
    try {
      const configOverride = req.body;
      const buffer = await reportService.renderSamplePdf(configOverride);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="Sample-Invoice.pdf"`);
      res.setHeader("Content-Length", buffer.length);
      return res.send(buffer);
    } catch (error: any) {
      console.error("Error generating sample PDF:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to generate sample invoice PDF",
      });
    }
  }

  async getSampleHtml(req: Request, res: Response) {
    try {
      const configOverride = req.body;
      const html = await reportService.renderSampleHtml(configOverride);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    } catch (error: any) {
      console.error("Error generating sample HTML:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to generate sample invoice preview",
      });
    }
  }

  async getPrintConfig(req: Request, res: Response) {
    try {
      const txParam = req.params.transactionType;
      const transactionType = (Array.isArray(txParam) ? txParam[0] : txParam) || "repairing-bill";
      const templateKey = req.query.templateKey as string | undefined;

      const config = await printConfigService.getConfig(transactionType, templateKey);
      return res.json({ success: true, data: config });
    } catch (error: any) {
      console.error("Error fetching print config:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch print configuration",
      });
    }
  }

  async getAllPrintConfigs(req: Request, res: Response) {
    try {
      const transactionType = req.query.transactionType as string | undefined;
      const configs = await printConfigService.getAllConfigs(transactionType);
      return res.json({ success: true, data: configs });
    } catch (error: any) {
      console.error("Error fetching all print configs:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch print configurations",
      });
    }
  }

  async savePrintConfig(req: Request, res: Response) {
    try {
      const saved = await printConfigService.saveConfig(req.body);
      return res.json({ success: true, data: saved });
    } catch (error: any) {
      console.error("Error saving print config:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to save print configuration",
      });
    }
  }

  async resetPrintConfig(req: Request, res: Response) {
    try {
      const txParam = req.params.transactionType;
      const transactionType = (Array.isArray(txParam) ? txParam[0] : txParam) || "repairing-bill";
      const reset = await printConfigService.resetToDefault(transactionType);
      return res.json({ success: true, data: reset });
    } catch (error: any) {
      console.error("Error resetting print config:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to reset print configuration",
      });
    }
  }
}

export const reportController = new ReportController();
