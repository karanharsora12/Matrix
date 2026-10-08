import type { Request, Response } from "express";
import { ordersService } from "../services/orders.service";
import { getPaginationOptions, buildPaginatedResponse, buildListResponse } from "../utils/pagination";

export class OrdersController {
  async getOrders(req: Request, res: Response) {
    try {
      const options = getPaginationOptions(req);
      if (options.isPaginated) {
        const result = await ordersService.getOrders(options);
        return res.json(buildPaginatedResponse(req, "orders", result));
      }

      const result = await ordersService.getOrders();
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
      // Remove ID from body if provided, as we want DB to auto-generate
      const { id, ...newOrder } = req.body;
      const created = await ordersService.createOrder(newOrder);
      res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      console.error("Error creating order:", error);
      if (error.code === "23505") { // PostgreSQL unique violation code
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
