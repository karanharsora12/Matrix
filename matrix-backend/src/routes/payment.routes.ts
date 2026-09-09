import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";

const router = Router();

router.get("/", paymentController.getPayments);
router.post("/", paymentController.getPayments);
router.get("/:id", paymentController.getPaymentById);
router.post("/create", paymentController.createPayment);
router.put("/:id", paymentController.updatePayment);
router.delete("/:id", paymentController.deletePayment);

export default router;
