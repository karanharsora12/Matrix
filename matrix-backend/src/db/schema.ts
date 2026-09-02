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
