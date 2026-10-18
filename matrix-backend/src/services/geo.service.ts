import { eq, asc, desc, ilike, and, or, count, type SQL } from "drizzle-orm";
import { db } from "../db";
import { countries, states, cities, areas, pincodes } from "../db/schema";
import {
  calculatePagination,
  buildAgGridFilterConditions,
  buildAgGridSort,
} from "../utils/pagination";
import type { PaginationOptions } from "../utils/pagination";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeoListOptions extends Partial<PaginationOptions> {
  countryId?: number | undefined;
  stateId?: number | undefined;
  cityId?: number | undefined;
  areaId?: number | undefined;
  isActive?: boolean | undefined;
  filterModel?: Record<string, any> | undefined;
  sortModel?: any[] | undefined;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSort<T extends Record<string, any>>(
  table: T,
  sortField: string | undefined,
  sortDirection: "asc" | "desc" | undefined,
  defaultColumn: any,
): any {
  const col =
    sortField && table[sortField as keyof T]
      ? table[sortField as keyof T]
      : defaultColumn;
  return sortDirection === "desc" ? desc(col as any) : asc(col as any);
}

function applyPagination<T>(query: T, options: GeoListOptions): T {
  if (options.fetchAll || !options.limit || options.limit === -1) return query;
  const limit = Math.min(500, Math.max(1, options.limit));
  const offset =
    options.offset !== undefined && Number.isFinite(options.offset)
      ? Math.max(0, options.offset)
      : (Math.max(1, options.page ?? 1) - 1) * limit;
  return (query as any).limit(limit).offset(offset) as T;
}

async function countQuery(table: any, where: SQL | undefined): Promise<number> {
  const result = await db.select({ total: count() }).from(table).where(where);
  return Number(result[0]?.total ?? 0);
}

// ─── Countries ────────────────────────────────────────────────────────────────

export class GeoService {
  // Countries
  async getCountries(options: GeoListOptions = {}) {
    const { search, sortField, sortDirection, isActive } = options;

    const filterableColumns: Record<string, any> = {
      id: countries.id,
      name: countries.name,
      code: countries.code,
      phoneCode: countries.phoneCode,
      isActive: countries.isActive,
    };

    const conditions: (SQL | undefined)[] = [];
    if (search?.trim()) {
      conditions.push(
        or(
          ilike(countries.name, `%${search.trim()}%`),
          ilike(countries.code, `%${search.trim()}%`),
          ilike(countries.phoneCode, `%${search.trim()}%`),
        ),
      );
    }
    if (isActive !== undefined) {
      conditions.push(eq(countries.isActive, isActive));
    }
    if (options?.filterModel) {
      const gridFilters = buildAgGridFilterConditions(
        options.filterModel,
        filterableColumns,
      );
      if (gridFilters.length > 0) conditions.push(...gridFilters);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy = buildAgGridSort(
      options?.sortModel,
      sortField,
      sortDirection,
      filterableColumns,
      asc(countries.name),
    );

    const query = db.select().from(countries).where(where).orderBy(orderBy);
    const [data, totalResult] = await Promise.all([
      applyPagination(query, options),
      countQuery(countries, where),
    ]);
    return {
      data,
      pagination: calculatePagination(
        totalResult,
        options.page,
        options.limit,
        options.fetchAll,
      ),
    };
  }

  async getCountryById(id: number) {
    const [row] = await db.select().from(countries).where(eq(countries.id, id));
    return row ?? null;
  }

  async createCountry(input: {
    name: string;
    code?: string;
    phoneCode?: string;
    isActive?: boolean;
    addBy?: number;
  }) {
    const [row] = await db
      .insert(countries)
      .values({
        name: input.name.trim(),
        code: input.code?.trim().toUpperCase(),
        phoneCode: input.phoneCode?.trim(),
        isActive: input.isActive ?? true,
        addBy: input.addBy,
        editBy: input.addBy,
      })
      .returning();
    return row;
  }

  async updateCountry(
    id: number,
    input: {
      name?: string;
      code?: string;
      phoneCode?: string;
      isActive?: boolean;
      editBy?: number;
    },
  ) {
    const [row] = await db
      .update(countries)
      .set({
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.code !== undefined
          ? { code: input.code.trim().toUpperCase() }
          : {}),
        ...(input.phoneCode !== undefined
          ? { phoneCode: input.phoneCode.trim() }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        editBy: input.editBy,
        updatedAt: new Date(),
      })
      .where(eq(countries.id, id))
      .returning();
    return row ?? null;
  }

  async deleteCountry(id: number) {
    const [row] = await db
      .delete(countries)
      .where(eq(countries.id, id))
      .returning();
    return row ?? null;
  }

  // States
  async getStates(options: GeoListOptions = {}) {
    const { search, sortField, sortDirection, isActive, countryId } = options;

    const filterableColumns: Record<string, any> = {
      id: states.id,
      name: states.name,
      code: states.code,
      countryId: states.countryId,
      countryName: countries.name,
      isActive: states.isActive,
    };

    const conditions: (SQL | undefined)[] = [];
    if (countryId) conditions.push(eq(states.countryId, countryId));
    if (search?.trim()) {
      conditions.push(
        or(
          ilike(states.name, `%${search.trim()}%`),
          ilike(states.code, `%${search.trim()}%`),
          ilike(countries.name, `%${search.trim()}%`),
        ),
      );
    }
    if (isActive !== undefined) conditions.push(eq(states.isActive, isActive));
    if (options?.filterModel) {
      const gridFilters = buildAgGridFilterConditions(
        options.filterModel,
        filterableColumns,
      );
      if (gridFilters.length > 0) conditions.push(...gridFilters);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy = buildAgGridSort(
      options?.sortModel,
      sortField,
      sortDirection,
      filterableColumns,
      asc(states.name),
    );

    const baseQuery = db
      .select({
        id: states.id,
        name: states.name,
        code: states.code,
        isActive: states.isActive,
        countryId: states.countryId,
        countryName: countries.name,
        createdAt: states.createdAt,
        updatedAt: states.updatedAt,
      })
      .from(states)
      .leftJoin(countries, eq(states.countryId, countries.id))
      .where(where)
      .orderBy(orderBy);

    const [data, totalResult] = await Promise.all([
      applyPagination(baseQuery, options),
      db
        .select({ total: count() })
        .from(states)
        .leftJoin(countries, eq(states.countryId, countries.id))
        .where(where)
        .then((res) => Number(res[0]?.total ?? 0)),
    ]);
    return {
      data,
      pagination: calculatePagination(
        totalResult,
        options.page,
        options.limit,
        options.fetchAll,
      ),
    };
  }

  async getStateById(id: number) {
    const [row] = await db
      .select({
        id: states.id,
        name: states.name,
        code: states.code,
        isActive: states.isActive,
        countryId: states.countryId,
        countryName: countries.name,
      })
      .from(states)
      .leftJoin(countries, eq(states.countryId, countries.id))
      .where(eq(states.id, id));
    return row ?? null;
  }

  async createState(input: {
    name: string;
    countryId: number;
    code?: string;
    isActive?: boolean;
    addBy?: number;
  }) {
    const [row] = await db
      .insert(states)
      .values({
        name: input.name.trim(),
        countryId: input.countryId,
        code: input.code?.trim().toUpperCase(),
        isActive: input.isActive ?? true,
        addBy: input.addBy,
        editBy: input.addBy,
      })
      .returning();
    return row;
  }

  async updateState(
    id: number,
    input: {
      name?: string;
      countryId?: number;
      code?: string;
      isActive?: boolean;
      editBy?: number;
    },
  ) {
    const [row] = await db
      .update(states)
      .set({
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.countryId !== undefined
          ? { countryId: input.countryId }
          : {}),
        ...(input.code !== undefined
          ? { code: input.code.trim().toUpperCase() }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        editBy: input.editBy,
        updatedAt: new Date(),
      })
      .where(eq(states.id, id))
      .returning();
    return row ?? null;
  }

  async deleteState(id: number) {
    const [row] = await db.delete(states).where(eq(states.id, id)).returning();
    return row ?? null;
  }

  // Cities
  async getCities(options: GeoListOptions = {}) {
    const { search, sortField, sortDirection, isActive, stateId } = options;

    const filterableColumns: Record<string, any> = {
      id: cities.id,
      name: cities.name,
      stateId: cities.stateId,
      stateName: states.name,
      countryId: states.countryId,
      countryName: countries.name,
      isActive: cities.isActive,
    };

    const conditions: (SQL | undefined)[] = [];
    if (stateId) conditions.push(eq(cities.stateId, stateId));
    if (search?.trim()) {
      conditions.push(
        or(
          ilike(cities.name, `%${search.trim()}%`),
          ilike(states.name, `%${search.trim()}%`),
          ilike(countries.name, `%${search.trim()}%`),
        ),
      );
    }
    if (isActive !== undefined) conditions.push(eq(cities.isActive, isActive));
    if (options?.filterModel) {
      const gridFilters = buildAgGridFilterConditions(
        options.filterModel,
        filterableColumns,
      );
      if (gridFilters.length > 0) conditions.push(...gridFilters);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy = buildAgGridSort(
      options?.sortModel,
      sortField,
      sortDirection,
      filterableColumns,
      asc(cities.name),
    );

    const baseQuery = db
      .select({
        id: cities.id,
        name: cities.name,
        isActive: cities.isActive,
        stateId: cities.stateId,
        stateName: states.name,
        countryId: states.countryId,
        countryName: countries.name,
        createdAt: cities.createdAt,
        updatedAt: cities.updatedAt,
      })
      .from(cities)
      .leftJoin(states, eq(cities.stateId, states.id))
      .leftJoin(countries, eq(states.countryId, countries.id))
      .where(where)
      .orderBy(orderBy);

    const [data, totalResult] = await Promise.all([
      applyPagination(baseQuery, options),
      db
        .select({ total: count() })
        .from(cities)
        .leftJoin(states, eq(cities.stateId, states.id))
        .leftJoin(countries, eq(states.countryId, countries.id))
        .where(where)
        .then((res) => Number(res[0]?.total ?? 0)),
    ]);
    return {
      data,
      pagination: calculatePagination(
        totalResult,
        options.page,
        options.limit,
        options.fetchAll,
      ),
    };
  }

  async getCityById(id: number) {
    const [row] = await db
      .select({
        id: cities.id,
        name: cities.name,
        isActive: cities.isActive,
        stateId: cities.stateId,
        stateName: states.name,
        countryId: states.countryId,
        countryName: countries.name,
      })
      .from(cities)
      .leftJoin(states, eq(cities.stateId, states.id))
      .leftJoin(countries, eq(states.countryId, countries.id))
      .where(eq(cities.id, id));
    return row ?? null;
  }

  async createCity(input: {
    name: string;
    stateId: number;
    isActive?: boolean;
    addBy?: number;
  }) {
    const [row] = await db
      .insert(cities)
      .values({
        name: input.name.trim(),
        stateId: input.stateId,
        isActive: input.isActive ?? true,
        addBy: input.addBy,
        editBy: input.addBy,
      })
      .returning();
    return row;
  }

  async updateCity(
    id: number,
    input: {
      name?: string;
      stateId?: number;
      isActive?: boolean;
      editBy?: number;
    },
  ) {
    const [row] = await db
      .update(cities)
      .set({
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.stateId !== undefined ? { stateId: input.stateId } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        editBy: input.editBy,
        updatedAt: new Date(),
      })
      .where(eq(cities.id, id))
      .returning();
    return row ?? null;
  }

  async deleteCity(id: number) {
    const [row] = await db.delete(cities).where(eq(cities.id, id)).returning();
    return row ?? null;
  }

  // Areas
  async getAreas(options: GeoListOptions = {}) {
    const { search, sortField, sortDirection, isActive, cityId } = options;

    const filterableColumns: Record<string, any> = {
      id: areas.id,
      name: areas.name,
      areaName: areas.name,
      cityId: areas.cityId,
      cityName: cities.name,
      stateId: cities.stateId,
      stateName: states.name,
      isActive: areas.isActive,
    };

    const conditions: (SQL | undefined)[] = [];
    if (cityId) conditions.push(eq(areas.cityId, cityId));
    if (search?.trim()) {
      conditions.push(
        or(
          ilike(areas.name, `%${search.trim()}%`),
          ilike(cities.name, `%${search.trim()}%`),
          ilike(states.name, `%${search.trim()}%`),
        ),
      );
    }
    if (isActive !== undefined) conditions.push(eq(areas.isActive, isActive));
    if (options?.filterModel) {
      const gridFilters = buildAgGridFilterConditions(
        options.filterModel,
        filterableColumns,
      );
      if (gridFilters.length > 0) conditions.push(...gridFilters);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy = buildAgGridSort(
      options?.sortModel,
      sortField,
      sortDirection,
      filterableColumns,
      asc(areas.name),
    );

    const baseQuery = db
      .select({
        id: areas.id,
        name: areas.name,
        isActive: areas.isActive,
        cityId: areas.cityId,
        cityName: cities.name,
        stateId: cities.stateId,
        stateName: states.name,
        createdAt: areas.createdAt,
        updatedAt: areas.updatedAt,
      })
      .from(areas)
      .leftJoin(cities, eq(areas.cityId, cities.id))
      .leftJoin(states, eq(cities.stateId, states.id))
      .where(where)
      .orderBy(orderBy);

    const [data, totalResult] = await Promise.all([
      applyPagination(baseQuery, options),
      db
        .select({ total: count() })
        .from(areas)
        .leftJoin(cities, eq(areas.cityId, cities.id))
        .leftJoin(states, eq(cities.stateId, states.id))
        .where(where)
        .then((res) => Number(res[0]?.total ?? 0)),
    ]);
    return {
      data,
      pagination: calculatePagination(
        totalResult,
        options.page,
        options.limit,
        options.fetchAll,
      ),
    };
  }

  async getAreaById(id: number) {
    const [row] = await db
      .select({
        id: areas.id,
        name: areas.name,
        isActive: areas.isActive,
        cityId: areas.cityId,
        cityName: cities.name,
        stateId: cities.stateId,
        stateName: states.name,
      })
      .from(areas)
      .leftJoin(cities, eq(areas.cityId, cities.id))
      .leftJoin(states, eq(cities.stateId, states.id))
      .where(eq(areas.id, id));
    return row ?? null;
  }

  async createArea(input: {
    name: string;
    cityId: number;
    isActive?: boolean;
    addBy?: number;
  }) {
    const [row] = await db
      .insert(areas)
      .values({
        name: input.name.trim(),
        cityId: input.cityId,
        isActive: input.isActive ?? true,
        addBy: input.addBy,
        editBy: input.addBy,
      })
      .returning();
    return row;
  }

  async updateArea(
    id: number,
    input: {
      name?: string;
      cityId?: number;
      isActive?: boolean;
      editBy?: number;
    },
  ) {
    const [row] = await db
      .update(areas)
      .set({
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.cityId !== undefined ? { cityId: input.cityId } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        editBy: input.editBy,
        updatedAt: new Date(),
      })
      .where(eq(areas.id, id))
      .returning();
    return row ?? null;
  }

  async deleteArea(id: number) {
    const [row] = await db.delete(areas).where(eq(areas.id, id)).returning();
    return row ?? null;
  }

  // Pincodes
  async getPincodes(options: GeoListOptions = {}) {
    const { search, sortField, sortDirection, isActive, cityId, areaId } =
      options;

    const filterableColumns: Record<string, any> = {
      id: pincodes.id,
      pincode: pincodes.pincode,
      officeName: pincodes.officeName,
      cityId: pincodes.cityId,
      cityName: cities.name,
      areaId: pincodes.areaId,
      areaName: areas.name,
      stateId: cities.stateId,
      stateName: states.name,
      isActive: pincodes.isActive,
    };

    const conditions: (SQL | undefined)[] = [];
    if (cityId) conditions.push(eq(pincodes.cityId, cityId));
    if (areaId) conditions.push(eq(pincodes.areaId, areaId));
    if (search?.trim()) {
      conditions.push(
        or(
          ilike(pincodes.pincode, `%${search.trim()}%`),
          ilike(pincodes.officeName ?? pincodes.pincode, `%${search.trim()}%`),
          ilike(cities.name, `%${search.trim()}%`),
          ilike(areas.name, `%${search.trim()}%`),
        ),
      );
    }
    if (isActive !== undefined)
      conditions.push(eq(pincodes.isActive, isActive));
    if (options?.filterModel) {
      const gridFilters = buildAgGridFilterConditions(
        options.filterModel,
        filterableColumns,
      );
      if (gridFilters.length > 0) conditions.push(...gridFilters);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy = buildAgGridSort(
      options?.sortModel,
      sortField,
      sortDirection,
      filterableColumns,
      asc(pincodes.pincode),
    );

    const baseQuery = db
      .select({
        id: pincodes.id,
        pincode: pincodes.pincode,
        officeName: pincodes.officeName,
        isActive: pincodes.isActive,
        cityId: pincodes.cityId,
        cityName: cities.name,
        areaId: pincodes.areaId,
        areaName: areas.name,
        stateId: cities.stateId,
        stateName: states.name,
        createdAt: pincodes.createdAt,
        updatedAt: pincodes.updatedAt,
      })
      .from(pincodes)
      .leftJoin(cities, eq(pincodes.cityId, cities.id))
      .leftJoin(areas, eq(pincodes.areaId, areas.id))
      .leftJoin(states, eq(cities.stateId, states.id))
      .where(where)
      .orderBy(orderBy);

    const [data, totalResult] = await Promise.all([
      applyPagination(baseQuery, options),
      db
        .select({ total: count() })
        .from(pincodes)
        .leftJoin(cities, eq(pincodes.cityId, cities.id))
        .leftJoin(areas, eq(pincodes.areaId, areas.id))
        .leftJoin(states, eq(cities.stateId, states.id))
        .where(where)
        .then((res) => Number(res[0]?.total ?? 0)),
    ]);
    return {
      data,
      pagination: calculatePagination(
        totalResult,
        options.page,
        options.limit,
        options.fetchAll,
      ),
    };
  }

  async getPincodeById(id: number) {
    const [row] = await db
      .select({
        id: pincodes.id,
        pincode: pincodes.pincode,
        officeName: pincodes.officeName,
        isActive: pincodes.isActive,
        cityId: pincodes.cityId,
        cityName: cities.name,
        areaId: pincodes.areaId,
        areaName: areas.name,
        stateId: cities.stateId,
        stateName: states.name,
      })
      .from(pincodes)
      .leftJoin(cities, eq(pincodes.cityId, cities.id))
      .leftJoin(areas, eq(pincodes.areaId, areas.id))
      .leftJoin(states, eq(cities.stateId, states.id))
      .where(eq(pincodes.id, id));
    return row ?? null;
  }

  async createPincode(input: {
    pincode: string;
    cityId: number;
    areaId?: number | undefined;
    officeName?: string | undefined;
    isActive?: boolean | undefined;
    addBy?: number | undefined;
  }) {
    const [row] = await db
      .insert(pincodes)
      .values({
        pincode: input.pincode.trim(),
        cityId: input.cityId,
        areaId: input.areaId,
        officeName: input.officeName?.trim(),
        isActive: input.isActive ?? true,
        addBy: input.addBy,
        editBy: input.addBy,
      })
      .returning();
    return row;
  }

  async updatePincode(
    id: number,
    input: {
      pincode?: string | undefined;
      cityId?: number | undefined;
      areaId?: number | undefined;
      officeName?: string | undefined;
      isActive?: boolean | undefined;
      editBy?: number | undefined;
    },
  ) {
    const [row] = await db
      .update(pincodes)
      .set({
        ...(input.pincode !== undefined
          ? { pincode: input.pincode.trim() }
          : {}),
        ...(input.cityId !== undefined ? { cityId: input.cityId } : {}),
        ...(input.areaId !== undefined ? { areaId: input.areaId } : {}),
        ...(input.officeName !== undefined
          ? { officeName: input.officeName.trim() }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        editBy: input.editBy,
        updatedAt: new Date(),
      })
      .where(eq(pincodes.id, id))
      .returning();
    return row ?? null;
  }

  async deletePincode(id: number) {
    const [row] = await db
      .delete(pincodes)
      .where(eq(pincodes.id, id))
      .returning();
    return row ?? null;
  }

  // Master data for dropdowns
  async getMasterData() {
    const [allCountries, allStates, allCities] = await Promise.all([
      db.select().from(countries).where(eq(countries.isActive, true)).orderBy(countries.name),
      db.select().from(states).where(eq(states.isActive, true)).orderBy(states.name),
      db.select().from(cities).where(eq(cities.isActive, true)).orderBy(cities.name),
    ]);
    return {
      countries: allCountries,
      states: allStates,
      cities: allCities,
    };
  }
}

export const geoService = new GeoService();
