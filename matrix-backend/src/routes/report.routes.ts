import { Router, type Request, type Response } from "express";
import { reportService } from "../services/report.service.js";

const router = Router();

router.get("/sales-invoice/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid sale ID" });
      return;
    }

    const pdfBuffer = await reportService.renderSalesInvoice(id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="sales-invoice-${id}.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("Error generating sales invoice PDF:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate sales invoice PDF",
    });
  }
});

router.get("/purchase-invoice/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid purchase ID" });
      return;
    }

    const pdfBuffer = await reportService.renderPurchaseInvoice(id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="purchase-invoice-${id}.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("Error generating purchase invoice PDF:", error);
    res.status(500).json({
      error: error?.message || "Failed to generate purchase invoice PDF",
    });
  }
});

export default router;
