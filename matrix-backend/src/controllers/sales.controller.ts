import type { Request, Response } from "express";
import { salesService } from "../services/sales.service";
import {
  getPaginationOptions,
  buildPaginatedResponse,
  buildListResponse,
} from "../utils/pagination";

function validateSalePayload(data: any) {
  if (!data?.voucherNo?.trim() || !Number(data.accountId) || !Number(data.daybookId)) {
    return "Bill number, transaction daybook, and customer are required";
  }
  if (!Array.isArray(data.itemLines) || data.itemLines.length === 0) {
    return "At least one repair item is required";
  }
  if (
    data.itemLines.some(
      (item: any) =>
        !Number(item.itemId) || Number(item.pcs) <= 0 || Number(item.amount) < 0,
    )
  ) {
    return "Each repair item needs an item, positive quantity, and valid amount";
  }
  const total = Number(data.grandTotal || 0);
  const advance = Number(data.advanceAmount || data.advanceAdjusted || 0);
  const cash = Number(data.cashAmount || 0);
  const bank = Number(data.bankAmount || 0);
  const totalSettled = advance + cash + bank;

  if (total < 0 || advance < 0 || cash < 0 || bank < 0) {
    return "Bill amounts cannot be negative";
  }
  if (totalSettled > total + 1) {
    // allow ₹1 tolerance for rounding
    return "Settlement amounts and adjusted advances cannot exceed grand total";
  }
  return null;
}

export class SalesController {
  constructor() {
    this.getSales = this.getSales.bind(this);
    this.getSaleById = this.getSaleById.bind(this);
    this.getEligibleReceipts = this.getEligibleReceipts.bind(this);
    this.createSale = this.createSale.bind(this);
    this.updateSale = this.updateSale.bind(this);
    this.deleteSale = this.deleteSale.bind(this);
  }

  async getSales(req: Request, res: Response) {
    try {
      const options = getPaginationOptions(req);
      const { daybookId, daybookGroupId, accountId, fromDate, toDate } =
        req.body || {};

      const queryOptions = {
        ...options,
        daybookId,
        daybookGroupId,
        accountId,
        fromDate,
        toDate,
      };

      if (options.isPaginated) {
        const result = await salesService.getSales(queryOptions);
        return res.json(buildPaginatedResponse(req, "sales", result));
      }

      const result = await salesService.getSales(queryOptions);
      res.json(buildListResponse(req, "sales", result.data));
    } catch (error) {
      console.error("Error fetching repairing bills:", error);
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
          .json({ success: false, error: "Repairing bill not found" });
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error("Error fetching repairing bill by id:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async getEligibleReceipts(req: Request, res: Response) {
    try {
      const { excludeSaleId, search, accountId } = req.query;
      const receipts = await salesService.getEligibleReceipts({
        excludeSaleId: excludeSaleId ? Number(excludeSaleId) : undefined,
        search: search ? String(search) : undefined,
        accountId: accountId ? Number(accountId) : undefined,
      });

      res.json({ success: true, data: receipts });
    } catch (error: any) {
      console.error("Error fetching eligible repairing receipts:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch eligible receipts",
      });
    }
  }

  async createSale(req: Request, res: Response) {
    try {
      const { id, ...newSale } = req.body;
      const validationError = validateSalePayload(newSale);
      if (validationError) {
        return res.status(400).json({ success: false, error: validationError });
      }
      const created = await salesService.createSale(newSale);
      res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      console.error("Error creating repairing bill:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "A bill with this voucher number already exists",
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

      const validationError = validateSalePayload(req.body);
      if (validationError) {
        return res.status(400).json({ success: false, error: validationError });
      }
      const updated = await salesService.updateSale(id, req.body);
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, error: "Repairing bill not found" });
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Error updating repairing bill:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "A bill with this voucher number already exists",
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
          .json({ success: false, error: "Repairing bill not found" });
      }
      res.json({ success: true, message: "Repairing bill deleted successfully" });
    } catch (error) {
      console.error("Error deleting repairing bill:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
}

export const salesController = new SalesController();
