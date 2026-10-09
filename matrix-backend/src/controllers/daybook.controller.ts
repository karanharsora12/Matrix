import type { Request, Response } from "express";
import { daybookService } from "../services/daybook.service";
import { buildListResponse } from "../utils/pagination";

export class DaybookController {
  // --- Daybook Groups ---
  async getDaybookGroups(req: Request, res: Response) {
    try {
      const groups = await daybookService.getDaybookGroups();
      res.json(buildListResponse(req, "daybookGroups", groups));
    } catch (error) {
      console.error("Error fetching daybook groups:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async getDaybookGroupById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });

      const data = await daybookService.getDaybookGroupById(id);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "Daybook group not found" });

      res.json({ success: true, data });
    } catch (error) {
      console.error("Error fetching daybook group by id:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async createDaybookGroup(req: Request, res: Response) {
    try {
      const { id, ...newGroup } = req.body;
      const created = await daybookService.createDaybookGroup(newGroup);
      res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      console.error("Error creating daybook group:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "Daybook group with this short name already exists",
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async updateDaybookGroup(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });

      const updated = await daybookService.updateDaybookGroup(id, req.body);
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, error: "Daybook group not found" });
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Error updating daybook group:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "Daybook group with this short name already exists",
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async deleteDaybookGroup(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });

      const deleted = await daybookService.deleteDaybookGroup(id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, error: "Daybook group not found" });
      }
      res.json({
        success: true,
        data: deleted,
        message: "Daybook group deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting daybook group:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  // --- Daybooks ---
  async getDaybooks(req: Request, res: Response) {
    try {
      const data = await daybookService.getDaybooks();
      res.json(buildListResponse(req, "daybooks", data));
    } catch (error) {
      console.error("Error fetching daybooks:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async getDaybookById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });

      const data = await daybookService.getDaybookById(id);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "Daybook not found" });

      res.json({ success: true, data });
    } catch (error) {
      console.error("Error fetching daybook by id:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async createDaybook(req: Request, res: Response) {
    try {
      const { id, ...newDaybook } = req.body;
      const created = await daybookService.createDaybook(newDaybook);
      res.status(201).json({ success: true, data: created });
    } catch (error: any) {
      console.error("Error creating daybook:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "Daybook with this short name already exists",
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async updateDaybook(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });

      const updated = await daybookService.updateDaybook(id, req.body);
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, error: "Daybook not found" });
      }
      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Error updating daybook:", error);
      if (error.code === "23505") {
        return res.status(400).json({
          success: false,
          error: "Daybook with this short name already exists",
        });
      }
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async deleteDaybook(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });

      const deleted = await daybookService.deleteDaybook(id);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, error: "Daybook not found" });
      }
      res.json({
        success: true,
        data: deleted,
        message: "Daybook deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting daybook:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  async generateVoucherNo(req: Request, res: Response) {
    try {
      const rawDaybookId = req.body?.daybookId;
      const rawDaybookGroupId = req.body?.daybookGroupId;
      const rawTableName = req.body?.tableName;

      const daybookId = rawDaybookId
        ? parseInt(String(rawDaybookId), 10)
        : undefined;
      const daybookGroupId = rawDaybookGroupId
        ? parseInt(String(rawDaybookGroupId), 10)
        : undefined;

      if (!daybookId && !daybookGroupId) {
        return res.status(400).json({
          success: false,
          error: "daybookId or daybookGroupId is required",
        });
      }

      const result = await daybookService.generateVoucherNo({
        daybookId,
        daybookGroupId,
        tableName: String(rawTableName),
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error("Error generating voucher number:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }
  async getDaybookReferences(req: Request, res: Response) {
    try {
      const params = req.body;

      const data = await daybookService.getDaybookReferences({
        daybookGroupId: params.daybookGroupId
          ? parseInt(String(params.daybookGroupId), 10)
          : undefined,
        daybookGroupShortName: params.daybookGroupShortName
          ? String(params.daybookGroupShortName)
          : undefined,
        daybookId: params.daybookId
          ? parseInt(String(params.daybookId), 10)
          : undefined,
        daybookShortName: params.daybookShortName
          ? String(params.daybookShortName)
          : undefined,
        sourceType: params.sourceType
          ? (String(params.sourceType) as any)
          : undefined,
        accountId: params.accountId
          ? parseInt(String(params.accountId), 10)
          : undefined,
        voucherNo: params.voucherNo ? String(params.voucherNo) : undefined,
        search: params.search ? String(params.search) : undefined,
        status: params.status ? (String(params.status) as any) : undefined,
        page: params.page ? parseInt(String(params.page), 10) : 1,
        limit: params.limit ? parseInt(String(params.limit), 10) : 50,
      });

      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Error fetching daybook references:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }
}

export const daybookController = new DaybookController();
