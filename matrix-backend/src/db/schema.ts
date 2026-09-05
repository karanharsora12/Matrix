import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  password: varchar("password", { length: 256 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const menus = pgTable("menus", {
  id: serial("id").primaryKey(),
  menuName: varchar("menu_name", { length: 256 }).notNull().unique(),
  menuCaption: varchar("menu_caption", { length: 256 }).notNull(),
  menuIcon: varchar("menu_icon", { length: 256 }),
  menuPath: varchar("menu_path", { length: 256 }),
  parentMenuId: integer("parent_menu_id").references(
    (): AnyPgColumn => menus.id,
  ),
  listRight: boolean("list_right").default(false).notNull(),
  viewRight: boolean("view_right").default(false).notNull(),
  addRight: boolean("add_right").default(false).notNull(),
  editRight: boolean("edit_right").default(false).notNull(),
  showListingTotalRight: boolean("show_listing_total_right")
    .default(false)
    .notNull(),
  exportRight: boolean("export_right").default(false).notNull(),
  printRight: boolean("print_right").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const metals = pgTable("metals", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull().unique(),
});

export const rateTypes = pgTable("rate_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull().unique(),
});

export const itemGroups = pgTable("item_groups", {
  id: serial("id").primaryKey(),
  itemGroupName: varchar("item_group_name", { length: 256 }).notNull().unique(),
  shortName: varchar("short_name", { length: 256 }).notNull(),
  metalTypeId: integer("metal_type_id")
    .references((): AnyPgColumn => metals.id)
    .notNull(),
  salesRate: numeric("sales_rate").notNull(),
  purchaseRate: numeric("purchase_rate").notNull(),
  salesRateTypeId: integer("sales_rate_type_id")
    .references((): AnyPgColumn => rateTypes.id)
    .notNull(),
  purchaseRateTypeId: integer("purchase_rate_type_id")
    .references((): AnyPgColumn => rateTypes.id)
    .notNull(),
  measureUnitCode: varchar("measure_unit_code", { length: 256 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const commonLists = pgTable("common_lists", {
  id: serial("id").primaryKey(),
  listType: varchar("list_type", { length: 256 }).notNull(),
  listValue: varchar("list_value", { length: 256 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const attributes = pgTable("attributes", {
  id: serial("id").primaryKey(),
  attributeNameId: integer("attribute_name_id")
    .references((): AnyPgColumn => commonLists.id)
    .notNull(),
  attributeValue: varchar("attribute_value", { length: 256 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  itemName: varchar("item_name", { length: 256 }).notNull(),
  shortName: varchar("short_name", { length: 256 }).notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  attributes: integer("attributes").array().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accountTypes = pgTable("account_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull().unique(),
  description: varchar("description", { length: 256 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accountGroups = pgTable("account_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull().unique(),
  description: varchar("description", { length: 256 }),
  accountTypeId: integer("account_type_id")
    .references((): AnyPgColumn => accountTypes.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  accountName: varchar("account_name", { length: 256 }).notNull(),
  firstName: varchar("first_name", { length: 256 }).notNull(),
  middleName: varchar("middle_name", { length: 256 }),
  lastName: varchar("last_name", { length: 256 }).notNull(),
  userName: varchar("user_name", { length: 256 }).notNull().unique(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  accountTypeId: integer("account_type_id")
    .references((): AnyPgColumn => accountTypes.id)
    .notNull(),
  accountGroupId: integer("account_group_id")
    .references((): AnyPgColumn => accountGroups.id)
    .notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const daybookGroups = pgTable("daybook_groups", {
  id: serial("id").primaryKey(),
  groupName: varchar("group_name", { length: 256 }).notNull(),
  shortName: varchar("short_name", { length: 256 }).notNull().unique(),
  description: varchar("description", { length: 256 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const daybooks = pgTable("daybooks", {
  id: serial("id").primaryKey(),
  daybookName: varchar("daybook_name", { length: 256 }).notNull(),
  shortName: varchar("short_name", { length: 256 }).notNull().unique(),
  daybookGroupId: integer("daybook_group_id")
    .references((): AnyPgColumn => daybookGroups.id)
    .notNull(),
  voucherPrefix: varchar("voucher_prefix", { length: 256 }).notNull(),
  allowManualNumber: boolean("allow_manual_number").default(false).notNull(),
  description: varchar("description", { length: 256 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

