import type { Request } from "express";

/**
 * Standard pagination options extracted from incoming request
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  search?: string | undefined;
  sortField?: string | undefined;
  sortDirection?: "asc" | "desc" | undefined;
  fetchAll?: boolean | undefined;
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

  return {
    isPaginated,
    fetchAll,
    page,
    limit,
    search: search || undefined,
    sortField: sortField || undefined,
    sortDirection,
  };
}

/**
 * Helper to normalize summary into an array (for frontend DataGrids / pinned rows)
 */
function normalizeSummary<TSummary>(
  summary: TSummary[] | TSummary | undefined,
  defaultCount?: number,
): TSummary[] | undefined {
  if (summary !== undefined && summary !== null) {
    return Array.isArray(summary) ? summary : [summary];
  }
  if (defaultCount !== undefined) {
    return [{ id: defaultCount } as unknown as TSummary];
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
    (totals as unknown as TSummary | TSummary[] | undefined)) as
    | TSummary
    | TSummary[]
    | undefined;
  const summary = normalizeSummary<TSummary>(rawSummary, total);

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
  const summary = normalizeSummary<TSummary>(rawSummary, data.length);

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
