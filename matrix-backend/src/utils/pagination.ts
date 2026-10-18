import type { Request } from "express";
import { sql, and, or, asc, desc, type SQL } from "drizzle-orm";

/**
 * Standard pagination options extracted from incoming request
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number | undefined;
  search?: string | undefined;
  sortField?: string | undefined;
  sortDirection?: "asc" | "desc" | undefined;
  fetchAll?: boolean | undefined;
  filterModel?: Record<string, any> | undefined;
  sortModel?: any[] | undefined;
  [key: string]: any;
}

/**
 * Pagination metadata returned in response
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Options to customize pagination extraction
 */
export interface PaginationConfig {
  defaultLimit?: number;
  maxLimit?: number;
}

/**
 * Additional options or metadata that can be passed when building responses
 */
export interface ResponseExtraOptions<
  TSummary = any,
  TMeta = Record<string, any>,
> {
  summary?: TSummary[] | TSummary | undefined;
  meta?: TMeta | undefined;
  message?: string | undefined;
  extra?: Record<string, any> | undefined;
}

/**
 * Input result structure from a paginated service query
 */
export interface PaginatedResultInput<
  TData = any,
  TSummary = any,
  TMeta = Record<string, any>,
> {
  data: TData[];
  pagination:
    | PaginationMeta
    | {
        page?: number | undefined;
        limit?: number | undefined;
        total?: number | undefined;
        totalPages?: number | undefined;
        hasNextPage?: boolean | undefined;
        hasPrevPage?: boolean | undefined;
      };
  summary?: TSummary[] | TSummary | undefined;
  meta?: TMeta | undefined;
  totals?: Record<string, any> | undefined;
  [key: string]: any;
}

/**
 * Standard paginated API response format
 */
export interface PaginatedApiResponse<
  TData = any,
  TSummary = any,
  TMeta = Record<string, any>,
> {
  success: boolean;
  api: string;
  input: any;
  data: TData[];
  pagination: PaginationMeta;
  summary?: TSummary[] | undefined;
  meta?: TMeta | undefined;
  message?: string | undefined;
  [key: string]: any;
}

/**
 * Standard list API response format
 */
export interface ListApiResponse<
  TData = any,
  TSummary = any,
  TMeta = Record<string, any>,
> {
  success: boolean;
  api: string;
  input: any;
  data: TData[];
  summary?: TSummary[] | undefined;
  meta?: TMeta | undefined;
  message?: string | undefined;
  [key: string]: any;
}

/**
 * Helper to compute pagination metadata consistently across services
 */
export function calculatePagination(
  total: number,
  page: number = 1,
  limit: number = 50,
  fetchAll: boolean = false,
): PaginationMeta {
  const safeTotal = Math.max(0, total);
  if (fetchAll || limit === -1) {
    return {
      page: 1,
      limit: safeTotal,
      total: safeTotal,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };
  }

  const safeLimit = Math.max(1, limit);
  const safePage = Math.max(1, page);
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeLimit));

  return {
    page: safePage,
    limit: safeLimit,
    total: safeTotal,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}

/**
 * Extracts and sanitizes pagination, search, and sorting parameters from Express request
 */
export function getPaginationOptions(
  req: Request,
  config: PaginationConfig = {},
): PaginationOptions & { isPaginated: boolean } {
  const defaultLimit = config.defaultLimit ?? 50;
  const maxLimit = config.maxLimit ?? 500;

  const pageRaw = req.body?.page ?? req.query?.page;
  const limitRaw = req.body?.limit ?? req.query?.limit;

  let page =
    typeof pageRaw === "number"
      ? pageRaw
      : Number.parseInt(pageRaw as string, 10);
  let limit =
    typeof limitRaw === "number"
      ? limitRaw
      : Number.parseInt(limitRaw as string, 10);

  const fetchAll =
    limit === -1 ||
    limitRaw === "-1" ||
    req.body?.fetchAll === true ||
    req.query?.fetchAll === "true";

  if (fetchAll) {
    limit = -1;
  } else if (Number.isFinite(limit)) {
    limit = Math.min(maxLimit, Math.max(1, limit));
  } else {
    limit = defaultLimit;
  }

  const isPaginated =
    Number.isFinite(page) || Number.isFinite(limitRaw) || fetchAll;

  page = Number.isFinite(page) ? Math.max(1, page) : 1;

  const searchRaw = req.body?.search ?? req.query?.search;
  const search = typeof searchRaw === "string" ? searchRaw.trim() : undefined;

  const sortFieldRaw = req.body?.sortField ?? req.query?.sortField;
  const sortField =
    typeof sortFieldRaw === "string" ? sortFieldRaw.trim() : undefined;

  const sortDirectionRaw = (
    req.body?.sortDirection ??
    req.query?.sortDirection ??
    "asc"
  )
    .toString()
    .toLowerCase();
  const sortDirection: "asc" | "desc" =
    sortDirectionRaw === "desc" ? "desc" : "asc";

  const rawFilterModel = req.body?.filterModel ?? req.query?.filterModel;
  let filterModel: Record<string, any> | undefined;
  if (rawFilterModel && typeof rawFilterModel === "object") {
    filterModel = rawFilterModel;
  } else if (typeof rawFilterModel === "string") {
    try {
      filterModel = JSON.parse(rawFilterModel);
    } catch {
      filterModel = undefined;
    }
  }

  const rawSortModel = req.body?.sortModel ?? req.query?.sortModel;
  let sortModel: any[] | undefined;
  if (Array.isArray(rawSortModel)) {
    sortModel = rawSortModel;
  } else if (typeof rawSortModel === "string") {
    try {
      const parsed = JSON.parse(rawSortModel);
      sortModel = Array.isArray(parsed) ? parsed : undefined;
    } catch {
      sortModel = undefined;
    }
  }

  const offsetRaw = req.body?.offset ?? req.query?.offset;
  const offset =
    typeof offsetRaw === "number"
      ? Math.max(0, offsetRaw)
      : Number.isFinite(Number.parseInt(offsetRaw as string, 10))
        ? Math.max(0, Number.parseInt(offsetRaw as string, 10))
        : undefined;

  return {
    isPaginated,
    fetchAll,
    page,
    limit,
    offset,
    search: search || undefined,
    sortField: sortField || undefined,
    sortDirection,
    filterModel,
    sortModel,
  };
}

/**
 * Helper to normalize summary into an array (for frontend DataGrids / pinned rows)
 */
function normalizeSummary<TSummary>(
  summary: TSummary[] | TSummary | undefined,
): TSummary[] | undefined {
  if (summary !== undefined && summary !== null) {
    return Array.isArray(summary) ? summary : [summary];
  }
  return undefined;
}

/**
 * Safely extracts request payload input
 */
function getRequestInput(req: Request): any {
  if (
    req.body &&
    typeof req.body === "object" &&
    Object.keys(req.body).length > 0
  ) {
    return req.body;
  }
  return req.query || {};
}

export function buildPaginatedResponse<
  TData = any,
  TSummary = any,
  TMeta = Record<string, any>,
>(
  req: Request,
  apiName: string,
  result: PaginatedResultInput<TData, TSummary, TMeta>,
  extraOptions?: ResponseExtraOptions<TSummary, TMeta>,
): PaginatedApiResponse<TData, TSummary, TMeta> {
  const {
    data,
    pagination,
    summary: resultSummary,
    meta: resultMeta,
    totals,
    ...restOfResult
  } = result;

  const page = pagination?.page ?? 1;
  const limit = pagination?.limit ?? data.length;
  const total = pagination?.total ?? data.length;
  const totalPages =
    pagination?.totalPages ?? (limit > 0 ? Math.ceil(total / limit) : 1);
  const hasNextPage = pagination?.hasNextPage ?? page * limit < total;
  const hasPrevPage = pagination?.hasPrevPage ?? page > 1;

  const normalizedPagination: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };

  // Resolve summary: extraOptions.summary > result.summary > result.totals > default [{ id: total }]
  const rawSummary = (extraOptions?.summary ??
    resultSummary ??
    (totals as unknown as TSummary | TSummary[] | undefined) ??
    ([{ id: `Total: ${total}`, total }] as unknown as TSummary[])) as
    | TSummary
    | TSummary[]
    | undefined;
  const summary = normalizeSummary<TSummary>(rawSummary);

  // Resolve meta: merge result.meta and extraOptions.meta
  const meta = {
    ...(resultMeta || {}),
    ...(extraOptions?.meta || {}),
  };

  const response: PaginatedApiResponse<TData, TSummary, TMeta> = {
    success: true,
    api: apiName,
    input: getRequestInput(req),
    data,
    pagination: normalizedPagination,
    summary,
    ...(Object.keys(meta).length > 0 ? { meta: meta as TMeta } : {}),
    ...(extraOptions?.message ? { message: extraOptions.message } : {}),
    ...restOfResult,
    ...(extraOptions?.extra || {}),
  };

  return response;
}

/**
 * Builds a flexible list response.
 * Accepts either an array of data OR an object containing data, summary, and meta.
 */
export function buildListResponse<
  TData = any,
  TSummary = any,
  TMeta = Record<string, any>,
>(
  req: Request,
  apiName: string,
  dataOrPayload:
    | TData[]
    | {
        data: TData[];
        summary?: TSummary[] | TSummary;
        meta?: TMeta;
        totals?: any;
        [key: string]: any;
      },
  extraOptions?: ResponseExtraOptions<TSummary, TMeta>,
): ListApiResponse<TData, TSummary, TMeta> {
  let data: TData[];
  let payloadSummary: TSummary[] | TSummary | undefined;
  let payloadMeta: TMeta | undefined;
  let payloadRest: Record<string, any> = {};

  if (Array.isArray(dataOrPayload)) {
    data = dataOrPayload;
  } else if (dataOrPayload && typeof dataOrPayload === "object") {
    const { data: innerData, summary, meta, totals, ...rest } = dataOrPayload;
    data = innerData || [];
    payloadSummary = (summary ??
      (totals as unknown as TSummary | TSummary[] | undefined)) as
      | TSummary
      | TSummary[]
      | undefined;
    payloadMeta = meta;
    payloadRest = rest;
  } else {
    data = [];
  }

  const rawSummary = extraOptions?.summary ?? payloadSummary;
  const summary = normalizeSummary<TSummary>(rawSummary);

  const meta = {
    ...(payloadMeta || {}),
    ...(extraOptions?.meta || {}),
  };

  return {
    success: true,
    api: apiName,
    input: getRequestInput(req),
    data,
    summary,
    ...(Object.keys(meta).length > 0 ? { meta: meta as TMeta } : {}),
    ...(extraOptions?.message ? { message: extraOptions.message } : {}),
    ...payloadRest,
    ...(extraOptions?.extra || {}),
  };
}

/**
 * Builds a flexible single item or master response with metadata support
 */
export function buildMasterResponse<TData = any, TMeta = Record<string, any>>(
  req: Request,
  apiName: string,
  data: TData,
  extraOptions?: {
    meta?: TMeta;
    message?: string;
    extra?: Record<string, any>;
  },
) {
  return {
    success: true,
    api: apiName,
    input: getRequestInput(req),
    data,
    ...(extraOptions?.meta ? { meta: extraOptions.meta } : {}),
    ...(extraOptions?.message ? { message: extraOptions.message } : {}),
    ...(extraOptions?.extra || {}),
  };
}

/**
 * Builds a single SQL condition for an individual AG Grid filter item
 */
function buildSingleFilterCondition(column: any, item: any): SQL | undefined {
  if (!item || !column) return undefined;

  // Handle primitive string/number values
  if (
    typeof item === "string" ||
    typeof item === "number" ||
    typeof item === "boolean"
  ) {
    const val = String(item).trim();
    return val ? sql`${column}::text ILIKE ${"%" + val + "%"}` : undefined;
  }

  const filterType = item.filterType || "text";
  const type = item.type || "contains";

  // Text Filter
  if (filterType === "text" || !filterType) {
    const rawFilter =
      item.filter !== undefined && item.filter !== null
        ? String(item.filter).trim()
        : "";

    if (type === "blank")
      return sql`(${column} IS NULL OR ${column}::text = '')`;
    if (type === "notBlank")
      return sql`(${column} IS NOT NULL AND ${column}::text <> '')`;
    if (!rawFilter) return undefined;

    switch (type) {
      case "contains":
        return sql`${column}::text ILIKE ${"%" + rawFilter + "%"}`;
      case "notContains":
        return sql`(${column} IS NULL OR ${column}::text NOT ILIKE ${"%" + rawFilter + "%"})`;
      case "equals":
        return sql`${column}::text ILIKE ${rawFilter}`;
      case "notEqual":
        return sql`(${column} IS NULL OR ${column}::text NOT ILIKE ${rawFilter})`;
      case "startsWith":
        return sql`${column}::text ILIKE ${rawFilter + "%"}`;
      case "endsWith":
        return sql`${column}::text ILIKE ${"%" + rawFilter}`;
      default:
        return sql`${column}::text ILIKE ${"%" + rawFilter + "%"}`;
    }
  }

  // Number Filter
  if (filterType === "number") {
    if (type === "blank") return sql`${column} IS NULL`;
    if (type === "notBlank") return sql`${column} IS NOT NULL`;
    const num = Number(item.filter);
    if (isNaN(num)) return undefined;

    switch (type) {
      case "equals":
        return sql`${column}::numeric = ${num}`;
      case "notEqual":
        return sql`(${column} IS NULL OR ${column}::numeric <> ${num})`;
      case "lessThan":
        return sql`${column}::numeric < ${num}`;
      case "lessThanOrEqual":
        return sql`${column}::numeric <= ${num}`;
      case "greaterThan":
        return sql`${column}::numeric > ${num}`;
      case "greaterThanOrEqual":
        return sql`${column}::numeric >= ${num}`;
      case "inRange": {
        const to = Number(item.filterTo);
        if (isNaN(to)) return sql`${column}::numeric >= ${num}`;
        return sql`${column}::numeric >= ${num} AND ${column}::numeric <= ${to}`;
      }
      default:
        return sql`${column}::numeric = ${num}`;
    }
  }

  // Date Filter
  if (filterType === "date") {
    if (type === "blank") return sql`${column} IS NULL`;
    if (type === "notBlank") return sql`${column} IS NOT NULL`;
    if (!item.dateFrom) return undefined;

    const fromDate = new Date(item.dateFrom);
    if (isNaN(fromDate.getTime())) return undefined;

    switch (type) {
      case "equals": {
        const nextDay = new Date(fromDate);
        nextDay.setDate(nextDay.getDate() + 1);
        return sql`${column} >= ${fromDate} AND ${column} < ${nextDay}`;
      }
      case "notEqual": {
        const nextDay = new Date(fromDate);
        nextDay.setDate(nextDay.getDate() + 1);
        return sql`(${column} IS NULL OR ${column} < ${fromDate} OR ${column} >= ${nextDay})`;
      }
      case "lessThan":
        return sql`${column} < ${fromDate}`;
      case "greaterThan": {
        const nextDay = new Date(fromDate);
        nextDay.setDate(nextDay.getDate() + 1);
        return sql`${column} >= ${nextDay}`;
      }
      case "inRange": {
        if (!item.dateTo) return sql`${column} >= ${fromDate}`;
        const toDate = new Date(item.dateTo);
        if (isNaN(toDate.getTime())) return sql`${column} >= ${fromDate}`;
        toDate.setDate(toDate.getDate() + 1);
        return sql`${column} >= ${fromDate} AND ${column} < ${toDate}`;
      }
      default:
        return sql`${column} >= ${fromDate}`;
    }
  }

  // Set Filter
  if (filterType === "set") {
    if (!Array.isArray(item.values) || item.values.length === 0)
      return undefined;
    const values = item.values.map((v: any) => String(v));
    return sql`${column}::text IN (${sql.join(
      values.map((v: string) => sql`${v}`),
      sql`, `,
    )})`;
  }

  return undefined;
}

/**
 * Builds an SQL condition for an AG Grid column filter (handles compound conditions)
 */
function buildAgGridColumnFilter(column: any, filterItem: any): SQL | undefined {
  if (!filterItem || !column) return undefined;

  // Handle compound filter with condition1 & condition2
  if (filterItem.condition1 || filterItem.condition2) {
    const c1 = buildSingleFilterCondition(column, filterItem.condition1);
    const c2 = buildSingleFilterCondition(column, filterItem.condition2);
    const op = (filterItem.operator || "AND").toUpperCase();

    if (c1 && c2) {
      return op === "OR" ? or(c1, c2) : and(c1, c2);
    }
    return c1 || c2;
  }

  // Handle array of conditions
  if (Array.isArray(filterItem.conditions) && filterItem.conditions.length > 0) {
    const subConds: SQL[] = [];
    for (const cond of filterItem.conditions) {
      const res = buildSingleFilterCondition(column, cond);
      if (res) subConds.push(res);
    }
    if (subConds.length === 0) return undefined;
    const op = (filterItem.operator || "AND").toUpperCase();
    return op === "OR" ? or(...subConds) : and(...subConds);
  }

  return buildSingleFilterCondition(column, filterItem);
}

/**
 * Converts AG Grid filterModel into parameterized Drizzle SQL conditions
 */
export function buildAgGridFilterConditions(
  filterModel: Record<string, any> | undefined,
  columnMap: Record<string, any>,
): SQL[] {
  if (!filterModel || typeof filterModel !== "object") return [];

  const conditions: SQL[] = [];

  for (const [colId, filterItem] of Object.entries(filterModel)) {
    const column = columnMap[colId];
    if (!column) continue;

    const condition = buildAgGridColumnFilter(column, filterItem);
    if (condition) {
      conditions.push(condition);
    }
  }

  return conditions;
}

/**
 * Builds an orderBy clause supporting AG Grid sortModel, sortField, or defaultSort
 */
export function buildAgGridSort(
  sortModel: any[] | undefined,
  sortField: string | undefined,
  sortDirection: "asc" | "desc" | undefined,
  columnMap: Record<string, any>,
  defaultSort?: any,
): any {
  if (Array.isArray(sortModel) && sortModel.length > 0) {
    const sortClauses: any[] = [];
    for (const item of sortModel) {
      const col = columnMap[item.colId];
      if (col) {
        sortClauses.push(item.sort?.toLowerCase() === "desc" ? desc(col) : asc(col));
      }
    }
    if (sortClauses.length === 1) return sortClauses[0];
    if (sortClauses.length > 1) return sql.join(sortClauses, sql`, `);
  }

  if (sortField && columnMap[sortField]) {
    const col = columnMap[sortField];
    return sortDirection === "desc" ? desc(col) : asc(col);
  }

  return defaultSort;
}
