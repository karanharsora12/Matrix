import { Router } from "express";
import { ordersController } from "../controllers/orders.controller";

const router = Router();

router.post("/", ordersController.getOrders);
router.get("/:id", ordersController.getOrderById);
router.post("/create", ordersController.createOrder);
router.put("/:id", ordersController.updateOrder);
router.delete("/:id", ordersController.deleteOrder);

export default router;
