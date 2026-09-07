import { Router } from "express";
import { inventoryController } from "../controllers/inventory.controller";

const router = Router();

router.post("/master-data", inventoryController.getMasterData.bind(inventoryController));

router.post("/item-groups", inventoryController.getItemGroups.bind(inventoryController));
router.post("/item-groups/create", inventoryController.createItemGroup.bind(inventoryController));
router.put("/item-groups/:id", inventoryController.updateItemGroup.bind(inventoryController));
router.delete("/item-groups/:id", inventoryController.deleteItemGroup.bind(inventoryController));

router.post("/items", inventoryController.getItems.bind(inventoryController));
router.post("/items/create", inventoryController.createItem.bind(inventoryController));
router.put("/items/:id", inventoryController.updateItem.bind(inventoryController));
router.delete("/items/:id", inventoryController.deleteItem.bind(inventoryController));

export default router;
