import { Router } from "express";
import { reportController } from "../controllers/report.controller";

const router = Router();

// Transaction invoice PDF & HTML preview
router.get("/transactions/:id/pdf", reportController.getTransactionPdf);
router.get("/transactions/:id/html", reportController.getTransactionHtml);

// Sample preview PDF and HTML for configuration testing
router.post("/sample/pdf", reportController.getSamplePdf);
router.post("/sample/html", reportController.getSampleHtml);

// Print Configurations CRUD
router.get("/config", reportController.getAllPrintConfigs);
router.get("/config/:transactionType", reportController.getPrintConfig);
router.post("/config", reportController.savePrintConfig);
router.post("/config/:transactionType/reset", reportController.resetPrintConfig);

export default router;
