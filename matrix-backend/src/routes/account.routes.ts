import { Router } from "express";
import { accountController } from "../controllers/account.controller";

const router = Router();

router.post("/master-data", accountController.getMasterData);
router.post("/", accountController.getAccounts);
router.get("/:id", accountController.getAccountById);
router.post("/create", accountController.createAccount);
router.put("/:id", accountController.updateAccount);
router.delete("/:id", accountController.deleteAccount);

export default router;
