import type { Request, Response } from "express";
import { purchaseService } from "../services/purchase.service";
import {
  getPaginationOptions,
  buildPaginatedResponse,
  buildListResponse,
} from "../utils/pagination";

export class PurchaseController {
  async getPurchases(req: Request, res: Response) {
    try {
      const options = getPaginationOptions(req);
      if (options.isPaginated) {
        const result = await purchaseService.getPurchases(options);
        return res.json(buildPaginatedResponse(req, "purchases", result));
      }

      const result = await purchaseService.getPurchases();
      res.json(buildListResponse(req, "purchases", result.data));
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async getPurchaseById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid ID" });
      }

      const data = await purchaseService.getPurchaseById(id);
      if (!data) {
        return res
          .status(404)
          .json({ success: false, error: "Purchase not found" });
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error("Error fetching purchase by id:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async createPurchase(req: Request, res: Response) {
    try {
      const { id, ...newPurchase } = req.body;
      const created = await purchaseService.createPurchase(newPurchase);
      res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      console.error("Error creating purchase:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "Purchase with this voucher number already exists",
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async updatePurchase(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid ID" });
      }

      const updated = await purchaseService.updatePurchase(id, req.body);
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, error: "Purchase not found" });
      }

      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Error updating purchase:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "Purchase with this voucher number already exists",
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async deletePurchase(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid ID" });
      }

      const deleted = await purchaseService.deletePurchase(id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, error: "Purchase not found" });
      }

      res.json({ success: true, message: "Purchase deleted successfully" });
    } catch (error) {
      console.error("Error deleting purchase:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
}

export const purchaseController = new PurchaseController();
