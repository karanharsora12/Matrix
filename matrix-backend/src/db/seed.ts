import { db } from "./index";
import {
  users,
  menus,
  metals,
  rateTypes,
  commonLists,
  attributes,
  accountTypes,
  accountGroups,
} from "./schema";
import { CommonListType } from "../constants/enums";
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

    console.log("Seeding metals...");
    await db
      .insert(metals)
      .values([
        { name: "Iron" },
        { name: "Mild Steel" },
        { name: "Carbon Steel" },
        { name: "Stainless Steel" },
        { name: "Alloy Steel" },
      ])
      .onConflictDoNothing({ target: metals.name });

    console.log("Seeding rate types...");
    await db
      .insert(rateTypes)
      .values([
        { name: "Kg * Rate" },
        { name: "Ton * Rate" },
        { name: "Pcs * Rate" },
        { name: "Meter * Rate" },
        { name: "Sq Ft * Rate" },
        { name: "Sq Meter * Rate" },
      ])
      .onConflictDoNothing({ target: rateTypes.name });

    console.log("Seeding common lists (MU)...");
    await db.insert(commonLists).values([
      { listType: CommonListType.MEASURE_UNIT, listValue: "PCS" },
      { listType: CommonListType.MEASURE_UNIT, listValue: "GM" },
      { listType: CommonListType.MEASURE_UNIT, listValue: "KG" },
      { listType: CommonListType.MEASURE_UNIT, listValue: "MTR" },
      { listType: CommonListType.MEASURE_UNIT, listValue: "SQFT" },
    ]);

    console.log("Seeding common lists (Attributes)...");
    const attributeCommonLists = await db
      .insert(commonLists)
      .values([
        { listType: CommonListType.ATTRIBUTE, listValue: "Grade" },
        { listType: CommonListType.ATTRIBUTE, listValue: "Diameter" },
        { listType: CommonListType.ATTRIBUTE, listValue: "Thickness" },
        { listType: CommonListType.ATTRIBUTE, listValue: "Width" },
        { listType: CommonListType.ATTRIBUTE, listValue: "Length" },
        { listType: CommonListType.ATTRIBUTE, listValue: "Shape" },
        { listType: CommonListType.ATTRIBUTE, listValue: "Standard" },
      ])
      .returning()
      .onConflictDoNothing({
        target: [commonLists.listType, commonLists.listValue],
      });

    console.log("Seeding attributes...");
    const attributeSeeds = [];

    const gradeList = attributeCommonLists.find((a) => a.listValue === "Grade");
    if (gradeList) {
      attributeSeeds.push({
        attributeNameId: gradeList.id,
        attributeValue: "Fe500D",
      });
      attributeSeeds.push({
        attributeNameId: gradeList.id,
        attributeValue: "Fe550",
      });
    }

    const diameterList = attributeCommonLists.find(
      (a) => a.listValue === "Diameter",
    );
    if (diameterList) {
      attributeSeeds.push({
        attributeNameId: diameterList.id,
        attributeValue: "12 mm",
      });
      attributeSeeds.push({
        attributeNameId: diameterList.id,
        attributeValue: "16 mm",
      });
    }

    const thicknessList = attributeCommonLists.find(
      (a) => a.listValue === "Thickness",
    );
    if (thicknessList) {
      attributeSeeds.push({
        attributeNameId: thicknessList.id,
        attributeValue: "5 mm",
      });
      attributeSeeds.push({
        attributeNameId: thicknessList.id,
        attributeValue: "10 mm",
      });
    }

    const widthList = attributeCommonLists.find((a) => a.listValue === "Width");
    if (widthList) {
      attributeSeeds.push({
        attributeNameId: widthList.id,
        attributeValue: "1250 mm",
      });
      attributeSeeds.push({
        attributeNameId: widthList.id,
        attributeValue: "1500 mm",
      });
    }

    const lengthList = attributeCommonLists.find(
      (a) => a.listValue === "Length",
    );
    if (lengthList) {
      attributeSeeds.push({
        attributeNameId: lengthList.id,
        attributeValue: "12 m",
      });
      attributeSeeds.push({
        attributeNameId: lengthList.id,
        attributeValue: "6 m",
      });
    }

    const shapeList = attributeCommonLists.find((a) => a.listValue === "Shape");
    if (shapeList) {
      attributeSeeds.push({
        attributeNameId: shapeList.id,
        attributeValue: "Round",
      });
      attributeSeeds.push({
        attributeNameId: shapeList.id,
        attributeValue: "Square",
      });
    }

    const standardList = attributeCommonLists.find(
      (a) => a.listValue === "Standard",
    );
    if (standardList) {
      attributeSeeds.push({
        attributeNameId: standardList.id,
        attributeValue: "IS 1786",
      });
      attributeSeeds.push({
        attributeNameId: standardList.id,
        attributeValue: "IS 2062",
      });
    }

    if (attributeSeeds.length > 0) {
      await db
        .insert(attributes)
        .values(attributeSeeds)
        .onConflictDoNothing({
          target: [attributes.attributeNameId, attributes.attributeValue],
        });
    }

    console.log("Seeding account types...");
    const accountTypesData = await db
      .insert(accountTypes)
      .values([
        { name: "Asset", description: "Resources owned by the business" },
        { name: "Liability", description: "Obligations of the business" },
        { name: "Equity", description: "Owner's claim on assets" },
        { name: "Income", description: "Revenue earned by the business" },
        { name: "Expense", description: "Costs incurred by the business" },
      ])
      .onConflictDoNothing({ target: accountTypes.name })
      .returning();

    const currentAccountTypes =
      accountTypesData.length > 0
        ? accountTypesData
        : await db.select().from(accountTypes);

    console.log("Seeding account groups...");
    const accountGroupsSeeds = [];

    const assetType = currentAccountTypes.find((t) => t.name === "Asset");
    if (assetType) {
      accountGroupsSeeds.push({
        name: "Current Assets",
        description: "Short-term assets",
        accountTypeId: assetType.id,
      });
      accountGroupsSeeds.push({
        name: "Fixed Assets",
        description: "Long-term assets",
        accountTypeId: assetType.id,
      });
    }

    const liabilityType = currentAccountTypes.find(
      (t) => t.name === "Liability",
    );
    if (liabilityType) {
      accountGroupsSeeds.push({
        name: "Current Liabilities",
        description: "Short-term obligations",
        accountTypeId: liabilityType.id,
      });
      accountGroupsSeeds.push({
        name: "Long Term Liabilities",
        description: "Long-term obligations",
        accountTypeId: liabilityType.id,
      });
    }

    const equityType = currentAccountTypes.find((t) => t.name === "Equity");
    if (equityType) {
      accountGroupsSeeds.push({
        name: "Capital Account",
        description: "Owner capital",
        accountTypeId: equityType.id,
      });
      accountGroupsSeeds.push({
        name: "Retained Earnings",
        description: "Accumulated profits",
        accountTypeId: equityType.id,
      });
    }

    const incomeType = currentAccountTypes.find((t) => t.name === "Income");
    if (incomeType) {
      accountGroupsSeeds.push({
        name: "Direct Income",
        description: "Core revenue",
        accountTypeId: incomeType.id,
      });
      accountGroupsSeeds.push({
        name: "Indirect Income",
        description: "Other revenue",
        accountTypeId: incomeType.id,
      });
    }

    const expenseType = currentAccountTypes.find((t) => t.name === "Expense");
    if (expenseType) {
      accountGroupsSeeds.push({
        name: "Direct Expense",
        description: "Cost of goods sold",
        accountTypeId: expenseType.id,
      });
      accountGroupsSeeds.push({
        name: "Indirect Expense",
        description: "Operating expenses",
        accountTypeId: expenseType.id,
      });
    }

    if (accountGroupsSeeds.length > 0) {
      await db
        .insert(accountGroups)
        .values(accountGroupsSeeds)
        .onConflictDoNothing({ target: accountGroups.name });
    }

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
