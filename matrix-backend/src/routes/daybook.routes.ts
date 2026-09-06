import { Router } from "express";
import { daybookController } from "../controllers/daybook.controller";

const router = Router();

router.get(
  "/groups",
  daybookController.getDaybookGroups.bind(daybookController),
);
router.get(
  "/groups/:id",
  daybookController.getDaybookGroupById.bind(daybookController),
);
router.post(
  "/groups",
  daybookController.createDaybookGroup.bind(daybookController),
);
router.put(
  "/groups/:id",
  daybookController.updateDaybookGroup.bind(daybookController),
);
router.delete(
  "/groups/:id",
  daybookController.deleteDaybookGroup.bind(daybookController),
);

// Daybooks CRUD
router.get("/", daybookController.getDaybooks.bind(daybookController));
router.get("/:id", daybookController.getDaybookById.bind(daybookController));
router.get(
  "/generate-voucher-no",
  daybookController.generateVoucherNo.bind(daybookController),
);
router.post(
  "/generate-voucher-no",
  daybookController.generateVoucherNo.bind(daybookController),
);
router.post("/", daybookController.createDaybook.bind(daybookController));
router.put("/:id", daybookController.updateDaybook.bind(daybookController));
router.delete("/:id", daybookController.deleteDaybook.bind(daybookController));

export default router;
