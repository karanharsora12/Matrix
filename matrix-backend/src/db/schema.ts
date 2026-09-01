import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  boolean,
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
