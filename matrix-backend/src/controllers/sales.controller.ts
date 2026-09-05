import type { Request, Response } from "express";
import { salesService } from "../services/sales.service";

export class SalesController {
  async getSales(req: Request, res: Response) {
    try {
      const sales = await salesService.getSales();
      const summary = [{ id: sales.length }];
      res.json({ success: true, data: sales, summary });
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async getSaleById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid ID" });
      }

      const data = await salesService.getSaleById(id);
      if (!data) {
        return res
          .status(404)
          .json({ success: false, error: "Sale not found" });
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error("Error fetching sale by id:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async createSale(req: Request, res: Response) {
    try {
      // Remove ID from body if provided, as we want DB to auto-generate
      const { id, ...newSale } = req.body;
      const created = await salesService.createSale(newSale);
      res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      console.error("Error creating sale:", error);
      if (error.code === "23505") { // PostgreSQL unique violation code
        return res.status(400).json({
          success: false,
          error: "Sale with this voucher number already exists",
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async updateSale(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid ID" });
      }

      const updated = await salesService.updateSale(id, req.body);
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, error: "Sale not found" });
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Error updating sale:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "Sale with this voucher number already exists",
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async deleteSale(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid ID" });
      }

      const deleted = await salesService.deleteSale(id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, error: "Sale not found" });
      }
      res.json({
        success: true,
        data: deleted,
        message: "Sale deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting sale:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
}

export const salesController = new SalesController();
