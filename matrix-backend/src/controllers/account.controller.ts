import type { Request, Response } from "express";
import { accountService } from "../services/account.service";

export class AccountController {
  async getMasterData(req: Request, res: Response) {
    try {
      const data = await accountService.getMasterData();
      res.json(data);
    } catch (error) {
      console.error("Error fetching account master data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getAccounts(req: Request, res: Response) {
    try {
      const data = await accountService.getAccounts();
      res.json(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async createAccount(req: Request, res: Response) {
    try {
      const data = await accountService.createAccount(req.body);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Error creating account:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          error: "Account with this name, username or email already exists",
        });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async updateAccount(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const data = await accountService.updateAccount(id, req.body);
      if (!data) {
        return res.status(404).json({ error: "Account not found" });
      }

      res.json(data);
    } catch (error: any) {
      console.error("Error updating account:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          error: "Account with this name, username or email already exists",
        });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async deleteAccount(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const data = await accountService.deleteAccount(id);
      if (!data) {
        return res.status(404).json({ error: "Account not found" });
      }

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export const accountController = new AccountController();
