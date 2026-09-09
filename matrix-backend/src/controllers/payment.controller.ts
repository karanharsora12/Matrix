import type { Request, Response } from "express";
import { paymentService } from "../services/payment.service";
import {
  getPaginationOptions,
  buildPaginatedResponse,
  buildListResponse,
} from "../utils/pagination";

export class PaymentController {
  async getPayments(req: Request, res: Response) {
    try {
      const options = getPaginationOptions(req);
      const transactionType =
        (req.query.transactionType as string) ||
        req.body?.transactionType ||
        undefined;
      const search =
        (req.query.search as string) || req.body?.search || undefined;

      if (options.isPaginated) {
        const result = await paymentService.getPayments({
          ...options,
          transactionType,
          search,
        });
        return res.json(buildPaginatedResponse(req, "payments", result));
      }

      const result = await paymentService.getPayments({
        fetchAll: true,
        transactionType,
        search,
      });
      res.json(buildListResponse(req, "payments", result.data));
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async getPaymentById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid ID" });
      }

      const data = await paymentService.getPaymentById(id);
      if (!data) {
        return res
          .status(404)
          .json({ success: false, error: "Payment voucher not found" });
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error("Error fetching payment by id:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async createPayment(req: Request, res: Response) {
    try {
      const { id, ...newPayment } = req.body;
      const created = await paymentService.createPayment(newPayment);
      res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      console.error("Error creating payment:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "Payment with this voucher number already exists",
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async updatePayment(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid ID" });
      }

      const updated = await paymentService.updatePayment(id, req.body);
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, error: "Payment voucher not found" });
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Error updating payment:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "Payment with this voucher number already exists",
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async deletePayment(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid ID" });
      }

      const deleted = await paymentService.deletePayment(id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, error: "Payment voucher not found" });
      }
      res.json({
        success: true,
        data: deleted,
        message: "Payment voucher deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
}

export const paymentController = new PaymentController();
