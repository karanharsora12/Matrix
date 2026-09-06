import { eq , sql, gt } from "drizzle-orm";
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

async getAccounts(limit: number, cursor?: number) {
  const query = db
    .select()
    .from(accounts)
    .orderBy(accounts.id)
    .limit(limit + 1); // fetch one extra to know if there's more

  const rows = cursor
    ? await query.where(gt(accounts.id, cursor))
    : await query;

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null;

  return { data, nextCursor, hasMore };
}

async getAccountsCount() {
  const result = await db.select({ count: sql<number>`count(*)` }).from(accounts);
  return Number(result[0]?.count ?? 0);
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
