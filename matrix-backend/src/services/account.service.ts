import { asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "../db";
import { accounts, accountTypes, accountGroups } from "../db/schema";

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
    search?: string;
    sortField?: string;
    sortDirection?: "asc" | "desc";
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const search = options.search?.trim();
    const whereClause = search
      ? or(
          ilike(accounts.accountName, `%${search}%`),
          ilike(accounts.userName, `%${search}%`),
          ilike(accounts.email, `%${search}%`),
        )
      : undefined;

    // Only database columns may be selected for sorting. This keeps query
    // parameters from becoming SQL identifiers and gives computed columns a
    // predictable fallback order.
    const sortableColumns = {
      id: accounts.id,
      accountName: accounts.accountName,
      userName: accounts.userName,
      email: accounts.email,
      firstName: accounts.firstName,
      middleName: accounts.middleName,
      lastName: accounts.lastName,
      accountTypeId: accounts.accountTypeId,
      accountGroupId: accounts.accountGroupId,
      isActive: accounts.isActive,
    };
    const sortColumn =
      sortableColumns[options.sortField as keyof typeof sortableColumns] ||
      accounts.id;
    const orderBy =
      options.sortDirection === "desc" ? desc(sortColumn) : asc(sortColumn);

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(accounts)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() }).from(accounts).where(whereClause),
    ]);
    const total = Number(totalResult[0]?.total || 0);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
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
