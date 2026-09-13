import { Router } from "express";
import { purchaseController } from "../controllers/purchase.controller";

const router = Router();

router.post("/", purchaseController.getPurchases);
router.get("/:id", purchaseController.getPurchaseById);
router.post("/create", purchaseController.createPurchase);
router.put("/:id", purchaseController.updatePurchase);
router.delete("/:id", purchaseController.deletePurchase);

export default router;
