import { Router } from "express";
import { emailController } from "../controllers/email.controller";

const router = Router();

// Template configurations
router.get("/templates", emailController.getAllTemplates);
router.get("/templates/:templateKey", emailController.getTemplate);
router.post("/templates", emailController.saveTemplate);
router.post("/templates/:templateKey/reset", emailController.resetTemplate);

// Transaction Emailing & Preview
router.get("/preview/:templateKey/:transactionId", emailController.previewTransactionEmail);
router.post("/send", emailController.sendTransactionEmail);
router.get("/logs/:transactionId", emailController.getTransactionLogs);

export default router;
