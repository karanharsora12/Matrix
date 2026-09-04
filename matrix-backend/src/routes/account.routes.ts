import { Router } from "express";
import { accountController } from "../controllers/account.controller";

const router = Router();

router.get("/master-data", accountController.getMasterData);
router.get("/", accountController.getAccounts);
router.get("/:id", accountController.getAccountById);
router.post("/", accountController.createAccount);
router.put("/:id", accountController.updateAccount);
router.delete("/:id", accountController.deleteAccount);

export default router;
