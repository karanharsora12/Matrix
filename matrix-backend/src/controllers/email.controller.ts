import type { Request, Response } from "express";
import { emailService } from "../services/email.service";

export class EmailController {
  async getAllTemplates(req: Request, res: Response) {
    try {
      const templates = await emailService.getAllTemplates();
      res.json({ success: true, data: templates });
    } catch (error: any) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to fetch email templates" });
    }
  }

  async getTemplate(req: Request, res: Response) {
    try {
      const templateKey = String(req.params.templateKey);
      const template = await emailService.getTemplate(templateKey);
      res.json({ success: true, data: template });
    } catch (error: any) {
      console.error("Error fetching email template:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to fetch email template" });
    }
  }

  async saveTemplate(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const saved = await emailService.saveTemplate(req.body, userId);
      res.json({ success: true, data: saved, message: "Email template saved successfully" });
    } catch (error: any) {
      console.error("Error saving email template:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to save email template" });
    }
  }

  async resetTemplate(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const templateKey = String(req.params.templateKey);
      const reset = await emailService.resetTemplate(templateKey, userId);
      res.json({ success: true, data: reset, message: "Email template reset to default" });
    } catch (error: any) {
      console.error("Error resetting email template:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to reset email template" });
    }
  }

  async previewTransactionEmail(req: Request, res: Response) {
    try {
      const transactionId = Number(req.params.transactionId);
      const templateKey = String(req.params.templateKey || "repairing-bill");
      const preview = await emailService.previewTransactionEmail(
        transactionId,
        templateKey
      );
      res.json({ success: true, data: preview });
    } catch (error: any) {
      console.error("Error generating email preview:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to generate email preview" });
    }
  }

  async sendTransactionEmail(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const result = await emailService.sendTransactionEmail({
        ...req.body,
        userId,
      });
      res.json({ success: true, data: result, message: result.message });
    } catch (error: any) {
      console.error("Error sending transaction email:", error);
      res.status(400).json({ success: false, error: error.message || "Failed to send email" });
    }
  }

  async getTransactionLogs(req: Request, res: Response) {
    try {
      const logs = await emailService.getEmailLogsForTransaction(Number(req.params.transactionId));
      res.json({ success: true, data: logs });
    } catch (error: any) {
      console.error("Error fetching email logs:", error);
      res.status(500).json({ success: false, error: error.message || "Failed to fetch email logs" });
    }
  }
}

export const emailController = new EmailController();
