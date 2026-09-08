import type { Request } from "express";

export interface PaginationOptions {
  page: number;
  limit: number;
  search?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  fetchAll?: boolean;
}

export function getPaginationOptions(req: Request): PaginationOptions & { isPaginated: boolean } {
  const pageRaw = req.body?.page || req.query?.page;
  const limitRaw = req.body?.limit || req.query?.limit;

  let page = Number.parseInt(pageRaw as string, 10);
  let limit = Number.parseInt(limitRaw as string, 10);

  const fetchAll = limit === -1 || limitRaw === "-1";
  
  if (fetchAll) {
    limit = -1;
  }

  const isPaginated = Number.isFinite(page) || Number.isFinite(limit) || fetchAll;

  const search = typeof req.body?.search === "string" ? req.body.search : (typeof req.query?.search === "string" ? req.query.search : undefined);
  const sortField = typeof req.body?.sortField === "string" ? req.body.sortField : (typeof req.query?.sortField === "string" ? req.query.sortField : undefined);
  const sortDirection = req.body?.sortDirection === "desc" || req.query?.sortDirection === "desc" ? "desc" : "asc";

  return {
    isPaginated,
    fetchAll,
    page: Number.isFinite(page) ? Math.max(1, page) : 1,
    limit: fetchAll ? -1 : (Number.isFinite(limit) ? Math.max(1, limit) : 50),
    search,
    sortField,
    sortDirection,
  };
}

export function buildPaginatedResponse(req: Request, apiName: string, result: { data: any[]; pagination: any }) {
  return {
    success: true,
    api: apiName,
    input: req.body && Object.keys(req.body).length > 0 ? req.body : req.query,
    data: result.data,
    summary: [{ id: result.pagination.total }],
    pagination: result.pagination,
  };
}

export function buildListResponse(req: Request, apiName: string, data: any[]) {
  return {
    success: true,
    api: apiName,
    input: req.body && Object.keys(req.body).length > 0 ? req.body : req.query,
    data,
    summary: [{ id: data.length }],
  };
}

export function buildMasterResponse(req: Request, apiName: string, data: any) {
  return {
    success: true,
    api: apiName,
    input: req.body && Object.keys(req.body).length > 0 ? req.body : req.query,
    data,
  };
}
