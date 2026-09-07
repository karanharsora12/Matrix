import { Router } from "express";
import { salesController } from "../controllers/sales.controller";

const router = Router();

router.post("/", salesController.getSales);
router.get("/:id", salesController.getSaleById);
router.post("/create", salesController.createSale);
router.put("/:id", salesController.updateSale);
router.delete("/:id", salesController.deleteSale);

export default router;
