import { Router } from "express";
import { db } from "../db/index";
import { menus } from "../db/schema";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const allMenus = await db.select().from(menus);

    // Build hierarchical tree
    const menuMap = new Map();
    allMenus.forEach((menu) => {
      menuMap.set(menu.id, { ...menu, children: [], fullPath: menu.menuPath });
    });

    const rootMenus: any[] = [];

    allMenus.forEach((menu) => {
      const mappedMenu = menuMap.get(menu.id);
      if (menu.parentMenuId) {
        const parent = menuMap.get(menu.parentMenuId);
        if (parent) {
          // Construct the full URL path hierarchically
          mappedMenu.fullPath =
            parent.fullPath === "/"
              ? `/${mappedMenu.menuPath.replace(/^\//, "")}`
              : `${parent.fullPath}${mappedMenu.menuPath}`;

          // ensure no double slashes
          mappedMenu.fullPath = mappedMenu.fullPath.replace(/\/\//g, "/");

          parent.children.push(mappedMenu);
        } else {
          rootMenus.push(mappedMenu);
        }
      } else {
        rootMenus.push(mappedMenu);
      }
    });

    res.json(rootMenus);
  } catch (error) {
    console.error("Error fetching menus:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
