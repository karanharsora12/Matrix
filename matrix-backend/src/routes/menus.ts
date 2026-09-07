import { Router } from "express";
import { menuController } from "../controllers/menu.controller";

const router = Router();

router.post("/", menuController.getMenus);
router.post("/create", menuController.createMenu);
router.put("/:id", menuController.updateMenu);
router.delete("/:id", menuController.deleteMenu);

export default router;
