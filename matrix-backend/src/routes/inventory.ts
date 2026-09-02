import { Router } from "express";
import { inventoryController } from "../controllers/inventory.controller";

const router = Router();

router.get("/master-data", inventoryController.getMasterData.bind(inventoryController));

router.get("/item-groups", inventoryController.getItemGroups.bind(inventoryController));
router.post("/item-groups", inventoryController.createItemGroup.bind(inventoryController));
router.put("/item-groups/:id", inventoryController.updateItemGroup.bind(inventoryController));
router.delete("/item-groups/:id", inventoryController.deleteItemGroup.bind(inventoryController));

export default router;
