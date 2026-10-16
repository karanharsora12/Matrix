import { Router } from "express";
import { salesController } from "../controllers/sales.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.post("/", salesController.getSales);
router.get("/eligible-receipts", salesController.getEligibleReceipts);
router.get("/:id", salesController.getSaleById);
router.post("/create", salesController.createSale);
router.put("/:id", salesController.updateSale);
router.delete("/:id", salesController.deleteSale);

export default router;
