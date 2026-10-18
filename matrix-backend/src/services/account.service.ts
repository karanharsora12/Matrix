import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "../db";
import { accounts, accountTypes, accountGroups } from "../db/schema";
import {
  buildAgGridFilterConditions,
  buildAgGridSort,
} from "../utils/pagination";

export class AccountService {
  async getMasterData() {
    const [typesData, groupsData] = await Promise.all([
      db.select().from(accountTypes).orderBy(accountTypes.id),
      db.select().from(accountGroups).orderBy(accountGroups.id),
    ]);
    return {
      accountTypes: typesData,
      accountGroups: groupsData,
    };
  }

  async getAccounts() {
    return await db.select().from(accounts).orderBy(accounts.id);
  }

  async getAccountsPage(options: {
    page: number;
    limit: number;
    offset?: number | undefined;
    search?: string | undefined;
    sortField?: string | undefined;
    sortDirection?: "asc" | "desc" | undefined;
    fetchAll?: boolean | undefined;
    filterModel?: Record<string, any> | undefined;
    sortModel?: any[] | undefined;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = options.fetchAll
      ? -1
      : Math.min(500, Math.max(1, options.limit || 50));

    const filterableColumns: Record<string, any> = {
      id: accounts.id,
      accountName: accounts.accountName,
      userName: accounts.userName,
      email: accounts.email,
      firstName: accounts.firstName,
      middleName: accounts.middleName,
      lastName: accounts.lastName,
      accountTypeId: accounts.accountTypeId,
      typeName: accountTypes.name,
      accountGroupId: accounts.accountGroupId,
      groupName: accountGroups.name,
      isActive: accounts.isActive,
    };

    const conditions: (SQL | undefined)[] = [];

    const search = options.search?.trim();
    if (search) {
      conditions.push(
        or(
          ilike(accounts.accountName, `%${search}%`),
          ilike(accounts.userName, `%${search}%`),
          ilike(accounts.email, `%${search}%`),
          ilike(accounts.firstName, `%${search}%`),
          ilike(accounts.lastName, `%${search}%`),
        ),
      );
    }

    if (options?.filterModel) {
      const gridFilters = buildAgGridFilterConditions(
        options.filterModel,
        filterableColumns,
      );
      if (gridFilters.length > 0) {
        conditions.push(...gridFilters);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy = buildAgGridSort(
      options?.sortModel,
      options?.sortField,
      options?.sortDirection,
      filterableColumns,
      asc(accounts.accountName),
    );

    let query = db
      .select({
        id: accounts.id,
        accountName: accounts.accountName,
        userName: accounts.userName,
        email: accounts.email,
        firstName: accounts.firstName,
        middleName: accounts.middleName,
        lastName: accounts.lastName,
        accountTypeId: accounts.accountTypeId,
        typeName: accountTypes.name,
        accountGroupId: accounts.accountGroupId,
        groupName: accountGroups.name,
        isActive: accounts.isActive,
        createdAt: accounts.createdAt,
        updatedAt: accounts.updatedAt,
      })
      .from(accounts)
      .leftJoin(accountTypes, eq(accounts.accountTypeId, accountTypes.id))
      .leftJoin(accountGroups, eq(accounts.accountGroupId, accountGroups.id))
      .where(whereClause)
      .orderBy(orderBy);

    if (!options.fetchAll && limit !== -1) {
      const offset =
        options.offset !== undefined && Number.isFinite(options.offset)
          ? Math.max(0, options.offset)
          : (page - 1) * limit;
      query = query.limit(limit).offset(offset) as any;
    }

    const [data, totalResult] = await Promise.all([
      query,
      db
        .select({ total: count() })
        .from(accounts)
        .leftJoin(accountTypes, eq(accounts.accountTypeId, accountTypes.id))
        .leftJoin(accountGroups, eq(accounts.accountGroupId, accountGroups.id))
        .where(whereClause),
    ]);
    const total = Number(totalResult[0]?.total || 0);

    return {
      data,
      pagination: {
        page,
        limit: options.fetchAll ? total : limit,
        total,
        totalPages: options.fetchAll || limit === -1 ? 1 : Math.ceil(total / limit),
        hasNextPage: options.fetchAll || limit === -1 ? false : page * limit < total,
      },
    };
  }

  async getAccountById(id: number) {
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id));
    return account;
  }

  async createAccount(data: any) {
    const [created] = await db.insert(accounts).values(data).returning();
    return created;
  }

  async updateAccount(id: number, data: any) {
    const { id: _, createdAt, updatedAt, ...updateData } = data;
    const [updated] = await db
      .update(accounts)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return updated;
  }

  async deleteAccount(id: number) {
    const [deleted] = await db
      .delete(accounts)
      .where(eq(accounts.id, id))
      .returning();
    return deleted;
  }
}

export const accountService = new AccountService();
