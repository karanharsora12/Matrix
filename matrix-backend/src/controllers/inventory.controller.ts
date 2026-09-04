import type { Request, Response } from "express";
import { inventoryService } from "../services/inventory.service";

export class InventoryController {
  async getMasterData(req: Request, res: Response) {
    try {
      const data = await inventoryService.getMasterData();
      res.json({ success: true, data });
    } catch (error) {
      console.error("Error fetching master data:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async getItemGroups(req: Request, res: Response) {
    try {
      const groups = await inventoryService.getItemGroups();
      const summary = [
        {
          id: groups.length,
        },
      ];
      res.json({ success: true, data: groups, summary });
    } catch (error) {
      console.error("Error fetching item groups:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async createItemGroup(req: Request, res: Response) {
    try {
      const { id, ...newGroup } = req.body;
      const created = await inventoryService.createItemGroup(newGroup);
      res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      console.error("Error creating item group:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async updateItemGroup(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });

      const updated = await inventoryService.updateItemGroup(id, req.body);
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, error: "Item group not found" });
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Error updating item group:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async deleteItemGroup(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });

      const deleted = await inventoryService.deleteItemGroup(id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, error: "Item group not found" });
      }
      res.json({
        success: true,
        data: deleted,
        message: "Item group deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting item group:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async getItems(req: Request, res: Response) {
    try {
      const items = await inventoryService.getItems();
      const summary = [
        {
          id: items.length,
        },
      ];
      res.json({ success: true, data: items, summary });
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async createItem(req: Request, res: Response) {
    try {
      const { id, ...newItem } = req.body;
      const created = await inventoryService.createItem(newItem);
      res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      console.error("Error creating item:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async updateItem(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });

      const updated = await inventoryService.updateItem(id, req.body);
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, error: "Item not found" });
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Error updating item:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async deleteItem(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });

      const deleted = await inventoryService.deleteItem(id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, error: "Item not found" });
      }
      res.json({
        success: true,
        data: deleted,
        message: "Item deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting item:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }
}

export const inventoryController = new InventoryController();
