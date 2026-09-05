import { Router } from "express";
import { salesController } from "../controllers/sales.controller";

const router = Router();

router.get("/", salesController.getSales);
router.get("/:id", salesController.getSaleById);
router.post("/", salesController.createSale);
router.put("/:id", salesController.updateSale);
router.delete("/:id", salesController.deleteSale);

export default router;
