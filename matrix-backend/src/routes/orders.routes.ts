import { Router } from "express";
import { ordersController } from "../controllers/orders.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Repairing receipts are transaction records, so direct API access requires
// the same authenticated session as the protected application route.
router.use(requireAuth);

router.post("/", ordersController.getOrders);
router.get("/:id", ordersController.getOrderById);
router.post("/create", ordersController.createOrder);
router.put("/:id", ordersController.updateOrder);
router.delete("/:id", ordersController.deleteOrder);

export default router;
