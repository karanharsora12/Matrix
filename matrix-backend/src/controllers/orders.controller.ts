import type { Request, Response } from "express";
import { ordersService } from "../services/orders.service";
import {
  getPaginationOptions,
  buildPaginatedResponse,
  buildListResponse,
} from "../utils/pagination";

function validateOrderPayload(data: any) {
  if (!data?.voucherNo?.trim() || !Number(data.accountId) || !Number(data.daybookId)) {
    return "Receipt number, transaction daybook, and customer are required";
  }
  if (!Array.isArray(data.itemLines) || data.itemLines.length === 0) {
    return "At least one repair item is required";
  }
  if (data.itemLines.some((item: any) => !Number(item.itemId) || Number(item.pcs) <= 0 || Number(item.amount) < 0)) {
    return "Each repair item needs an item, positive quantity, and valid amount";
  }
  const total = Number(data.grandTotal || 0);
  const received = Number(data.cashAmount || 0) + Number(data.bankAmount || 0);
  if (total < 0 || received < 0 || received > total) {
    return "Receipt amount cannot exceed the repair total";
  }
  return null;
}

export class OrdersController {
  constructor() {
    this.getOrders = this.getOrders.bind(this);
    this.getOrderById = this.getOrderById.bind(this);
    this.createOrder = this.createOrder.bind(this);
    this.updateOrder = this.updateOrder.bind(this);
    this.deleteOrder = this.deleteOrder.bind(this);
  }

  async getOrders(req: Request, res: Response) {
    try {
      const options = getPaginationOptions(req);
      const { daybookId, daybookGroupId, accountId, fromDate, toDate } = req.body || {};

      const queryOptions = {
        ...options,
        daybookId,
        daybookGroupId,
        accountId,
        fromDate,
        toDate,
      };

      if (options.isPaginated) {
        const result = await ordersService.getOrders(queryOptions);
        return res.json(buildPaginatedResponse(req, "orders", result));
      }

      const result = await ordersService.getOrders(queryOptions);
      res.json(buildListResponse(req, "orders", result.data));
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async getOrderById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid ID" });
      }

      const data = await ordersService.getOrderById(id);
      if (!data) {
        return res
          .status(404)
          .json({ success: false, error: "Order not found" });
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error("Error fetching order by id:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async createOrder(req: Request, res: Response) {
    try {
      const { id, ...newOrder } = req.body;
      const validationError = validateOrderPayload(newOrder);
      if (validationError) {
        return res.status(400).json({ success: false, error: validationError });
      }
      const created = await ordersService.createOrder(newOrder);
      res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      console.error("Error creating order:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "Order with this voucher number already exists",
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async updateOrder(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid ID" });
      }

      const validationError = validateOrderPayload(req.body);
      if (validationError) {
        return res.status(400).json({ success: false, error: validationError });
      }
      const updated = await ordersService.updateOrder(id, req.body);
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, error: "Order not found" });
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Error updating order:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "Order with this voucher number already exists",
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async deleteOrder(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: "Invalid ID" });
      }

      const deleted = await ordersService.deleteOrder(id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, error: "Order not found" });
      }
      res.json({ success: true, message: "Order deleted successfully" });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
}

export const ordersController = new OrdersController();
