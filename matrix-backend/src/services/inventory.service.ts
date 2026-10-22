import { eq, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db";
import {
  itemGroups,
  metals,
  rateTypes,
  commonLists,
  items,
  attributes,
  daybookGroups,
  daybooks,
  itemCodes,
  users,
} from "../db/schema";

const itemGroupsAddByUser = alias(users, "item_groups_add_by_user");
const itemGroupsEditByUser = alias(users, "item_groups_edit_by_user");

const itemsAddByUser = alias(users, "items_add_by_user");
const itemsEditByUser = alias(users, "items_edit_by_user");

const itemCodesAddByUser = alias(users, "item_codes_add_by_user");
const itemCodesEditByUser = alias(users, "item_codes_edit_by_user");

export class InventoryService {
  async getMasterData() {
    const [
      metalsData,
      rateTypesData,
      commonListsData,
      attributesData,
      daybookGroupsData,
      daybooksData,
    ] = await Promise.all([
      db.select().from(metals),
      db.select().from(rateTypes),
      db.select().from(commonLists),
      db.select().from(attributes),
      db.select().from(daybookGroups),
      db.select().from(daybooks),
    ]);
    return {
      metals: metalsData,
      rateTypes: rateTypesData,
      commonLists: commonListsData,
      attributes: attributesData,
      daybookGroups: daybookGroupsData,
      daybooks: daybooksData,
    };
  }

  async getItemGroups() {
    return await db
      .select({
        id: itemGroups.id,
        itemGroupName: itemGroups.itemGroupName,
        shortName: itemGroups.shortName,
        salesRateTypeId: itemGroups.salesRateTypeId,
        salesRate: itemGroups.salesRate,
        purchaseRateTypeId: itemGroups.purchaseRateTypeId,
        purchaseRate: itemGroups.purchaseRate,
        addBy: itemGroupsAddByUser.name,
        editBy: itemGroupsEditByUser.name,
        createdAt: itemGroups.createdAt,
        updatedAt: itemGroups.updatedAt,
      })
      .from(itemGroups)
      .leftJoin(
        itemGroupsAddByUser,
        eq(itemGroups.addBy, itemGroupsAddByUser.id),
      )
      .leftJoin(
        itemGroupsEditByUser,
        eq(itemGroups.editBy, itemGroupsEditByUser.id),
      )
      .orderBy(itemGroups.id);
  }

  async createItemGroup(data: any) {
    const {
      itemGroupName,
      shortName,
      metalId,
      salesRateTypeId,
      salesRate,
      purchaseRateTypeId,
      purchaseRate,
      addBy,
    } = data;
    const payload = {
      itemGroupName,
      shortName,
      metalId: metalId ? Number(metalId) : null,
      salesRateTypeId: salesRateTypeId ? Number(salesRateTypeId) : null,
      salesRate: salesRate !== undefined && salesRate !== "" ? String(salesRate) : null,
      purchaseRateTypeId: purchaseRateTypeId ? Number(purchaseRateTypeId) : null,
      purchaseRate: purchaseRate !== undefined && purchaseRate !== "" ? String(purchaseRate) : null,
      addBy: typeof addBy === "number" ? addBy : 1,
      editBy: null,
    };
    const [created] = await db
      .insert(itemGroups)
      .values(payload as any)
      .returning();
    return created;
  }

  async updateItemGroup(id: number, data: any) {
    const {
      itemGroupName,
      shortName,
      metalId,
      salesRateTypeId,
      salesRate,
      purchaseRateTypeId,
      purchaseRate,
      editBy,
    } = data;
    const payload: Record<string, any> = {
      updatedAt: new Date(),
      editBy: typeof editBy === "number" ? editBy : 1,
    };
    if (itemGroupName !== undefined) payload.itemGroupName = itemGroupName;
    if (shortName !== undefined) payload.shortName = shortName;
    if (metalId !== undefined) payload.metalId = metalId ? Number(metalId) : null;
    if (salesRateTypeId !== undefined) payload.salesRateTypeId = salesRateTypeId ? Number(salesRateTypeId) : null;
    if (salesRate !== undefined) payload.salesRate = salesRate !== "" ? String(salesRate) : null;
    if (purchaseRateTypeId !== undefined) payload.purchaseRateTypeId = purchaseRateTypeId ? Number(purchaseRateTypeId) : null;
    if (purchaseRate !== undefined) payload.purchaseRate = purchaseRate !== "" ? String(purchaseRate) : null;

    const [updated] = await db
      .update(itemGroups)
      .set(payload)
      .where(eq(itemGroups.id, id))
      .returning();
    return updated;
  }

  async deleteItemGroup(id: number) {
    const [deleted] = await db
      .delete(itemGroups)
      .where(eq(itemGroups.id, id))
      .returning();
    return deleted;
  }

  async getItems(itemGroupId?: number) {
    let query = db
      .select({
        id: items.id,
        itemName: items.itemName,
        shortName: items.shortName,
        itemGroupId: items.itemGroupId,
        itemGroupName: itemGroups.itemGroupName,
        isActive: items.isActive,
        attributes: items.attributes,
        addBy: itemsAddByUser.name,
        editBy: itemsEditByUser.name,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
      })
      .from(items)
      .leftJoin(itemGroups, eq(items.itemGroupId, itemGroups.id))
      .leftJoin(itemsAddByUser, eq(items.addBy, itemsAddByUser.id))
      .leftJoin(itemsEditByUser, eq(items.editBy, itemsEditByUser.id));

    if (itemGroupId) {
      return await query
        .where(eq(items.itemGroupId, itemGroupId))
        .orderBy(items.id);
    }

    return await query.orderBy(items.id);
  }

  async createItem(data: any) {
    const {
      itemName,
      shortName,
      itemGroupId,
      isActive,
      attributes,
      addBy,
    } = data;
    const payload = {
      itemName,
      shortName,
      itemGroupId: itemGroupId ? Number(itemGroupId) : null,
      isActive: isActive !== false,
      attributes: attributes || [],
      addBy: typeof addBy === "number" ? addBy : 1,
      editBy: null,
    };
    const [created] = await db.insert(items).values(payload).returning();
    return created;
  }

  async updateItem(id: number, data: any) {
    const {
      itemName,
      shortName,
      itemGroupId,
      isActive,
      attributes,
      editBy,
    } = data;
    const payload: Record<string, any> = {
      updatedAt: new Date(),
      editBy: typeof editBy === "number" ? editBy : 1,
    };
    if (itemName !== undefined) payload.itemName = itemName;
    if (shortName !== undefined) payload.shortName = shortName;
    if (itemGroupId !== undefined)
      payload.itemGroupId = itemGroupId ? Number(itemGroupId) : null;
    if (isActive !== undefined) payload.isActive = isActive;
    if (attributes !== undefined) payload.attributes = attributes;

    const [updated] = await db
      .update(items)
      .set(payload)
      .where(eq(items.id, id))
      .returning();
    return updated;
  }

  async deleteItem(id: number) {
    const [deleted] = await db
      .delete(items)
      .where(eq(items.id, id))
      .returning();
    return deleted;
  }

  // --- Item Codes ---
  async getItemCodes(
    filters: { itemId?: number | undefined; itemGroupId?: number | undefined } = {},
  ) {
    const conditions = [];
    if (filters.itemId) {
      conditions.push(eq(itemCodes.itemId, filters.itemId));
    }
    if (filters.itemGroupId) {
      conditions.push(eq(items.itemGroupId, filters.itemGroupId));
    }

    let query = db
      .select({
        id: itemCodes.id,
        itemId: itemCodes.itemId,
        itemCodeName: itemCodes.itemCodeName,
        attributeValues: itemCodes.attributeValues,
        isActive: itemCodes.isActive,
        itemName: items.itemName,
        itemShortName: items.shortName,
        itemGroupId: items.itemGroupId,
        itemGroupName: itemGroups.itemGroupName,
        addBy: itemCodesAddByUser.name,
        editBy: itemCodesEditByUser.name,
        createdAt: itemCodes.createdAt,
        updatedAt: itemCodes.updatedAt,
      })
      .from(itemCodes)
      .leftJoin(items, eq(itemCodes.itemId, items.id))
      .leftJoin(itemGroups, eq(items.itemGroupId, itemGroups.id))
      .leftJoin(itemCodesAddByUser, eq(itemCodes.addBy, itemCodesAddByUser.id))
      .leftJoin(
        itemCodesEditByUser,
        eq(itemCodes.editBy, itemCodesEditByUser.id),
      );

    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(itemCodes.id);
    }

    return await query.orderBy(itemCodes.id);
  }

  async createItemCode(data: any) {
    const {
      itemId,
      itemCodeName,
      attributeValues,
      isActive,
      addBy,
    } = data;
    const payload = {
      itemId: Number(itemId),
      itemCodeName,
      attributeValues: attributeValues || [],
      isActive: isActive !== false,
      addBy: typeof addBy === "number" ? addBy : 1,
      editBy: null,
    };
    const [created] = await db.insert(itemCodes).values(payload).returning();
    return created;
  }

  async updateItemCode(id: number, data: any) {
    const {
      itemId,
      itemCodeName,
      attributeValues,
      isActive,
      editBy,
    } = data;
    const payload: Record<string, any> = {
      updatedAt: new Date(),
      editBy: typeof editBy === "number" ? editBy : 1,
    };
    if (itemId !== undefined) payload.itemId = Number(itemId);
    if (itemCodeName !== undefined) payload.itemCodeName = itemCodeName;
    if (attributeValues !== undefined) payload.attributeValues = attributeValues;
    if (isActive !== undefined) payload.isActive = isActive;

    const [updated] = await db
      .update(itemCodes)
      .set(payload)
      .where(eq(itemCodes.id, id))
      .returning();
    return updated;
  }

  async deleteItemCode(id: number) {
    const [deleted] = await db
      .delete(itemCodes)
      .where(eq(itemCodes.id, id))
      .returning();
    return deleted;
  }
}

export const inventoryService = new InventoryService();
