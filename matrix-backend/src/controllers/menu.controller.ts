import type { Request, Response } from "express";
import { menuService } from "../services/menu.service";

export class MenuController {
  async getMenus(req: Request, res: Response) {
    try {
      const rootMenus = await menuService.getAllMenus();
      res.json(rootMenus);
    } catch (error) {
      console.error("Error fetching menus:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async createMenu(req: Request, res: Response) {
    try {
      const { id, ...newMenu } = req.body;
      const created = await menuService.createMenu(newMenu);
      res.status(201).json(created);
    } catch (error: any) {
      console.error("Error creating menu:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async updateMenu(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const updated = await menuService.updateMenu(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Menu not found" });
      }
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating menu:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async deleteMenu(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

      const deleted = await menuService.deleteMenu(id);
      if (!deleted) {
        return res.status(404).json({ error: "Menu not found" });
      }
      res.json(deleted);
    } catch (error: any) {
      console.error("Error deleting menu:", error);
      if (error.message === "Cannot delete menu with children") {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
}

export const menuController = new MenuController();
