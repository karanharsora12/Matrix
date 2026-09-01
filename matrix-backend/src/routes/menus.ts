import { Router } from "express";
import { menuController } from "../controllers/menu.controller";

const router = Router();

router.get("/", menuController.getMenus);
router.post("/", menuController.createMenu);
router.put("/:id", menuController.updateMenu);
router.delete("/:id", menuController.deleteMenu);

export default router;
