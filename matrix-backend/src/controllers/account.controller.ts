import type { Request, Response } from "express";
import { accountService } from "../services/account.service";
import { getPaginationOptions, buildPaginatedResponse, buildListResponse, buildMasterResponse } from "../utils/pagination";

export class AccountController {
  async getMasterData(req: Request, res: Response) {
    try {
      const data = await accountService.getMasterData();
      res.json(buildMasterResponse(req, "accountMasterData", data));
    } catch (error) {
      console.error("Error fetching account master data:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async getAccounts(req: Request, res: Response) {
    try {
      const options = getPaginationOptions(req);

      if (options.isPaginated) {
        const result = await accountService.getAccountsPage(options);
        return res.json(buildPaginatedResponse(req, "accounts", result));
      }

      const data = await accountService.getAccounts();
      res.json(buildListResponse(req, "accounts", data));
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async getAccountById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid ID format" });
      }

      const data = await accountService.getAccountById(id);
      if (!data) {
        return res
          .status(404)
          .json({ success: false, error: "Account not found" });
      }

      res.json({ success: true, data });
    } catch (error) {
      console.error("Error fetching account by id:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async createAccount(req: Request, res: Response) {
    try {
      const data = await accountService.createAccount(req.body);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      console.error("Error creating account:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "Account with this name, username or email already exists",
        });
      }
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async updateAccount(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid ID format" });
      }

      const data = await accountService.updateAccount(id, req.body);
      if (!data) {
        return res
          .status(404)
          .json({ success: false, error: "Account not found" });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Error updating account:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "Account with this name, username or email already exists",
        });
      }
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async deleteAccount(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid ID format" });
      }

      const data = await accountService.deleteAccount(id);
      if (!data) {
        return res
          .status(404)
          .json({ success: false, error: "Account not found" });
      }

      res.json({
        success: true,
        data,
        message: "Account deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
}

export const accountController = new AccountController();
