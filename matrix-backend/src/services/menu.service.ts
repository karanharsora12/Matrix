import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { menus } from "../db/schema";

export class MenuService {
  async getAllMenus() {
    const allMenus = await db.select().from(menus);

    // Build hierarchical tree
    const menuMap = new Map();
    allMenus.forEach((menu) => {
      menuMap.set(menu.id, { ...menu, children: [] });
    });

    const rootMenus: any[] = [];

    // Step 1: Establish parent-child relationships
    allMenus.forEach((menu) => {
      const mappedMenu = menuMap.get(menu.id);
      if (menu.parentMenuId) {
        const parent = menuMap.get(menu.parentMenuId);
        if (parent) {
          parent.children.push(mappedMenu);
        } else {
          rootMenus.push(mappedMenu);
        }
      } else {
        rootMenus.push(mappedMenu);
      }
    });

    // Step 2: Recursively compute fullPath from root down to all descendants
    function assignFullPath(node: any, parentPath: string = "") {
      const nodePath = (node.menuPath || "").replace(/^\//, "");
      const full = parentPath ? `${parentPath}/${nodePath}` : `/${nodePath}`;
      node.fullPath = full.replace(/\/+/g, "/");

      if (node.children && node.children.length > 0) {
        node.children.forEach((child: any) => assignFullPath(child, node.fullPath));
      }
    }

    rootMenus.forEach((root) => assignFullPath(root, ""));

    return rootMenus;
  }

  async createMenu(data: any) {
    const inserted = await db.insert(menus).values(data).returning();
    return inserted[0];
  }

  async updateMenu(id: number, data: any) {
    const updated = await db
      .update(menus)
      .set(data)
      .where(eq(menus.id, id))
      .returning();

    return updated.length > 0 ? updated[0] : null;
  }

  async deleteMenu(id: number) {
    // Check for children
    const children = await db.select().from(menus).where(eq(menus.parentMenuId, id));
    if (children.length > 0) {
      throw new Error("Cannot delete menu with children");
    }

    const deleted = await db.delete(menus).where(eq(menus.id, id)).returning();
    return deleted.length > 0 ? deleted[0] : null;
  }
}

export const menuService = new MenuService();
