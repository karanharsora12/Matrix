import { eq } from "drizzle-orm";
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
