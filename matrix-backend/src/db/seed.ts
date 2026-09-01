import { db } from "./index";
import { users, menus } from "./schema";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Seeding database...");

  try {
    // Generate a secure hash for the seed user
    const passwordHash = await bcrypt.hash("password123", 10);

    await db
      .insert(users)
      .values({
        name: "Admin User",
        email: "admin@company.com",
        password: passwordHash,
      })
      .onConflictDoNothing({ target: users.email });

    console.log("Seeding menus...");
    const [masterMenu] = await db
      .insert(menus)
      .values({
        menuName: "master",
        menuCaption: "Master",
        menuIcon: "Database",
        menuPath: "/master",
        listRight: true,
        viewRight: true,
        addRight: true,
        editRight: true,
        showListingTotalRight: true,
        printRight: true,
      })
      .onConflictDoUpdate({
        target: menus.menuName,
        set: { menuCaption: "Master", menuPath: "/master" },
      })
      .returning();

    const [adminSetupMenu] = await db
      .insert(menus)
      .values({
        menuName: "admin_setup",
        menuCaption: "Admin Setup",
        parentMenuId: masterMenu?.id || null,
        menuIcon: "Settings",
        menuPath: "/admin-setup",
        listRight: true,
        viewRight: true,
        addRight: true,
        editRight: true,
        showListingTotalRight: true,
        printRight: true,
      })
      .onConflictDoUpdate({
        target: menus.menuName,
        set: { menuCaption: "Admin Setup", menuPath: "/admin-setup" },
      })
      .returning();

    await db
      .insert(menus)
      .values({
        menuName: "menu_setup",
        menuCaption: "Menu Setup",
        parentMenuId: adminSetupMenu?.id || null,
        menuIcon: "Menu",
        menuPath: "/menu-setup",
        listRight: true,
        viewRight: true,
        addRight: true,
        editRight: true,
        showListingTotalRight: true,
        printRight: true,
      })
      .onConflictDoUpdate({
        target: menus.menuName,
        set: { menuCaption: "Menu Setup", menuPath: "/menu-setup" },
      });

    console.log("✅ Seed completed successfully.");
    console.log("Login User: admin@company.com");
    console.log("Password: password123");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    process.exit(0);
  }
}

main();
