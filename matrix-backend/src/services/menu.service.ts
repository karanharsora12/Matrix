import { asc, eq, isNull } from "drizzle-orm";
import { db } from "../db/index";
import { menus } from "../db/schema";

export class MenuService {
  async getAllMenus() {
    const allMenus = await db
      .select()
      .from(menus)
      .orderBy(asc(menus.orderNo), asc(menus.id));

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

    // Step 2: Recursively compute fullPath and sort children by orderNo, then id
    function assignFullPathAndSort(node: any, parentPath: string = "") {
      const nodePath = (node.menuPath || "").replace(/^\//, "");
      const full = parentPath ? `${parentPath}/${nodePath}` : `/${nodePath}`;
      node.fullPath = full.replace(/\/+/g, "/");

      if (node.children && node.children.length > 0) {
        node.children.sort(
          (a: any, b: any) =>
            (a.orderNo ?? 0) - (b.orderNo ?? 0) || a.id - b.id,
        );
        node.children.forEach((child: any) =>
          assignFullPathAndSort(child, node.fullPath),
        );
      }
    }

    rootMenus.sort(
      (a: any, b: any) =>
        (a.orderNo ?? 0) - (b.orderNo ?? 0) || a.id - b.id,
    );
    rootMenus.forEach((root) => assignFullPathAndSort(root, ""));

    return rootMenus;
  }

  async createMenu(data: any) {
    if (data.orderNo !== undefined && data.orderNo !== null && data.orderNo !== "") {
      data.orderNo = Number(data.orderNo);
    } else {
      const parentId = data.parentMenuId ? Number(data.parentMenuId) : null;
      const existing = await db
        .select({ orderNo: menus.orderNo })
        .from(menus)
        .where(
          parentId ? eq(menus.parentMenuId, parentId) : isNull(menus.parentMenuId),
        );
      const maxOrder = existing.reduce(
        (max, cur) => Math.max(max, cur.orderNo || 0),
        0,
      );
      data.orderNo = maxOrder + 1;
    }

    const inserted = await db.insert(menus).values(data).returning();
    return inserted[0];
  }

  async updateMenu(id: number, data: any) {
    if (data.orderNo !== undefined && data.orderNo !== null) {
      data.orderNo = Number(data.orderNo);
    }

    const updated = await db
      .update(menus)
      .set(data)
      .where(eq(menus.id, id))
      .returning();

    return updated.length > 0 ? updated[0] : null;
  }

  async updateOrder(items: { id: number; orderNo: number }[]) {
    for (const item of items) {
      if (item && item.id != null) {
        await db
          .update(menus)
          .set({ orderNo: Number(item.orderNo) })
          .where(eq(menus.id, Number(item.id)));
      }
    }
    return { success: true };
  }

  async deleteMenu(id: number) {
    // Check for children
    const children = await db
      .select()
      .from(menus)
      .where(eq(menus.parentMenuId, id));
    if (children.length > 0) {
      throw new Error("Cannot delete menu with children");
    }

    const deleted = await db.delete(menus).where(eq(menus.id, id)).returning();
    return deleted.length > 0 ? deleted[0] : null;
  }
}

export const menuService = new MenuService();
