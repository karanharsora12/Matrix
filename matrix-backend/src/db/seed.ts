import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import { CommonListType } from "../constants/enums";
import { db } from "./index";
import {
  accountGroups,
  accounts,
  accountTypes,
  attributes,
  commonLists,
  daybookGroups,
  daybooks,
  itemGroups,
  items,
  menus,
  metals,
  rateTypes,
  users,
} from "./schema";

dotenv.config();

async function main() {
  console.log("🚀 Seeding database...");

  try {
    // 1. Admin User
    console.log("Seeding admin user...");
    const passwordHash = await bcrypt.hash("password123", 10);
    await db
      .insert(users)
      .values({
        name: "Admin User",
        email: "admin@company.com",
        password: passwordHash,
      })
      .onConflictDoNothing({ target: users.email });

    // 2. Menus
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

    // 3. Metals
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

    const currentMetals = await db.select().from(metals);
    const metalMap = new Map(currentMetals.map((m) => [m.name, m.id]));

    // 4. Rate Types
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

    const currentRateTypes = await db.select().from(rateTypes);
    const rateTypeMap = new Map(currentRateTypes.map((r) => [r.name, r.id]));

    // 5. Common Lists (MU & Attributes)
    console.log("Seeding common lists...");
    const existingCommonLists = await db.select().from(commonLists);

    const defaultMUs = ["PCS", "GM", "KG", "MTR", "SQFT"];
    for (const mu of defaultMUs) {
      const exists = existingCommonLists.some(
        (c) => c.listType === CommonListType.MEASURE_UNIT && c.listValue === mu,
      );
      if (!exists) {
        const [created] = await db
          .insert(commonLists)
          .values({ listType: CommonListType.MEASURE_UNIT, listValue: mu })
          .returning();
        if (created) {
          existingCommonLists.push(created);
        }
      }
    }

    const defaultAttributes = [
      "Grade",
      "Diameter",
      "Thickness",
      "Width",
      "Length",
      "Shape",
      "Standard",
    ];
    for (const attr of defaultAttributes) {
      const exists = existingCommonLists.some(
        (c) => c.listType === CommonListType.ATTRIBUTE && c.listValue === attr,
      );
      if (!exists) {
        const [created] = await db
          .insert(commonLists)
          .values({ listType: CommonListType.ATTRIBUTE, listValue: attr })
          .returning();
        if (created) {
          existingCommonLists.push(created);
        }
      }
    }

    // 6. Attributes Values
    console.log("Seeding attribute values...");
    const existingAttributes = await db.select().from(attributes);
    const attributeSeeds: {
      attributeNameId: number;
      attributeValue: string;
    }[] = [];

    const gradeList = existingCommonLists.find(
      (a) => a.listType === CommonListType.ATTRIBUTE && a.listValue === "Grade",
    );
    if (gradeList) {
      attributeSeeds.push(
        { attributeNameId: gradeList.id, attributeValue: "Fe500D" },
        { attributeNameId: gradeList.id, attributeValue: "Fe550" },
      );
    }

    const diameterList = existingCommonLists.find(
      (a) =>
        a.listType === CommonListType.ATTRIBUTE && a.listValue === "Diameter",
    );
    if (diameterList) {
      attributeSeeds.push(
        { attributeNameId: diameterList.id, attributeValue: "12 mm" },
        { attributeNameId: diameterList.id, attributeValue: "16 mm" },
        { attributeNameId: diameterList.id, attributeValue: "20 mm" },
        { attributeNameId: diameterList.id, attributeValue: "25 mm" },
      );
    }

    const thicknessList = existingCommonLists.find(
      (a) =>
        a.listType === CommonListType.ATTRIBUTE && a.listValue === "Thickness",
    );
    if (thicknessList) {
      attributeSeeds.push(
        { attributeNameId: thicknessList.id, attributeValue: "5 mm" },
        { attributeNameId: thicknessList.id, attributeValue: "10 mm" },
        { attributeNameId: thicknessList.id, attributeValue: "16 mm" },
        { attributeNameId: thicknessList.id, attributeValue: "25 mm" },
      );
    }

    const widthList = existingCommonLists.find(
      (a) => a.listType === CommonListType.ATTRIBUTE && a.listValue === "Width",
    );
    if (widthList) {
      attributeSeeds.push(
        { attributeNameId: widthList.id, attributeValue: "1250 mm" },
        { attributeNameId: widthList.id, attributeValue: "1500 mm" },
      );
    }

    const lengthList = existingCommonLists.find(
      (a) =>
        a.listType === CommonListType.ATTRIBUTE && a.listValue === "Length",
    );
    if (lengthList) {
      attributeSeeds.push(
        { attributeNameId: lengthList.id, attributeValue: "6 m" },
        { attributeNameId: lengthList.id, attributeValue: "12 m" },
      );
    }

    const shapeList = existingCommonLists.find(
      (a) => a.listType === CommonListType.ATTRIBUTE && a.listValue === "Shape",
    );
    if (shapeList) {
      attributeSeeds.push(
        { attributeNameId: shapeList.id, attributeValue: "Round" },
        { attributeNameId: shapeList.id, attributeValue: "Square" },
        { attributeNameId: shapeList.id, attributeValue: "Hollow" },
      );
    }

    const standardList = existingCommonLists.find(
      (a) =>
        a.listType === CommonListType.ATTRIBUTE && a.listValue === "Standard",
    );
    if (standardList) {
      attributeSeeds.push(
        { attributeNameId: standardList.id, attributeValue: "IS 1786" },
        { attributeNameId: standardList.id, attributeValue: "IS 2062" },
        { attributeNameId: standardList.id, attributeValue: "ASTM A312" },
      );
    }

    for (const seed of attributeSeeds) {
      const exists = existingAttributes.some(
        (a) =>
          a.attributeNameId === seed.attributeNameId &&
          a.attributeValue === seed.attributeValue,
      );
      if (!exists) {
        await db.insert(attributes).values(seed);
      }
    }

    // 7. Account Types
    console.log("Seeding account types...");
    await db
      .insert(accountTypes)
      .values([
        { name: "Asset", description: "Resources owned by the business" },
        { name: "Liability", description: "Obligations of the business" },
        { name: "Equity", description: "Owner's claim on assets" },
        { name: "Income", description: "Revenue earned by the business" },
        { name: "Expense", description: "Costs incurred by the business" },
      ])
      .onConflictDoNothing({ target: accountTypes.name });

    const currentAccountTypes = await db.select().from(accountTypes);
    const accountTypeMap = new Map(
      currentAccountTypes.map((t) => [t.name, t.id]),
    );

    // 8. Account Groups
    console.log("Seeding account groups...");
    const accountGroupsSeeds = [];
    const assetId = accountTypeMap.get("Asset")!;
    const liabilityId = accountTypeMap.get("Liability")!;
    const equityId = accountTypeMap.get("Equity")!;
    const incomeId = accountTypeMap.get("Income")!;
    const expenseId = accountTypeMap.get("Expense")!;

    if (assetId) {
      accountGroupsSeeds.push(
        {
          name: "Current Assets",
          description: "Short-term assets",
          accountTypeId: assetId,
        },
        {
          name: "Fixed Assets",
          description: "Long-term assets",
          accountTypeId: assetId,
        },
      );
    }
    if (liabilityId) {
      accountGroupsSeeds.push(
        {
          name: "Current Liabilities",
          description: "Short-term obligations",
          accountTypeId: liabilityId,
        },
        {
          name: "Long Term Liabilities",
          description: "Long-term obligations",
          accountTypeId: liabilityId,
        },
      );
    }
    if (equityId) {
      accountGroupsSeeds.push(
        {
          name: "Capital Account",
          description: "Owner capital",
          accountTypeId: equityId,
        },
        {
          name: "Retained Earnings",
          description: "Accumulated profits",
          accountTypeId: equityId,
        },
      );
    }
    if (incomeId) {
      accountGroupsSeeds.push(
        {
          name: "Direct Income",
          description: "Core revenue",
          accountTypeId: incomeId,
        },
        {
          name: "Indirect Income",
          description: "Other revenue",
          accountTypeId: incomeId,
        },
      );
    }
    if (expenseId) {
      accountGroupsSeeds.push(
        {
          name: "Direct Expense",
          description: "Cost of goods sold",
          accountTypeId: expenseId,
        },
        {
          name: "Indirect Expense",
          description: "Operating expenses",
          accountTypeId: expenseId,
        },
      );
    }

    if (accountGroupsSeeds.length > 0) {
      await db
        .insert(accountGroups)
        .values(accountGroupsSeeds)
        .onConflictDoNothing({ target: accountGroups.name });
    }

    const currentAccountGroups = await db.select().from(accountGroups);
    const accountGroupMap = new Map(
      currentAccountGroups.map((g) => [g.name, g.id]),
    );

    // 9. Seeding Item Groups (22 Items Groups)
    console.log("Seeding item groups (22 groups)...");
    const msId = metalMap.get("Mild Steel") || 2;
    const csId = metalMap.get("Carbon Steel") || 3;
    const ssId = metalMap.get("Stainless Steel") || 4;
    const asId = metalMap.get("Alloy Steel") || 5;
    const irId = metalMap.get("Iron") || 1;

    const kgRate = rateTypeMap.get("Kg * Rate") || 1;
    const tonRate = rateTypeMap.get("Ton * Rate") || 2;
    const pcsRate = rateTypeMap.get("Pcs * Rate") || 3;
    const meterRate = rateTypeMap.get("Meter * Rate") || 4;
    const sqftRate = rateTypeMap.get("Sq Ft * Rate") || 5;

    const itemGroupsList = [
      {
        itemGroupName: "Hot Rolled Coils",
        shortName: "HRC",
        metalTypeId: msId,
        salesRate: "58.50",
        purchaseRate: "54.00",
        salesRateTypeId: kgRate,
        purchaseRateTypeId: kgRate,
        measureUnitCode: "KG",
      },
      {
        itemGroupName: "Cold Rolled Coils",
        shortName: "CRC",
        metalTypeId: csId,
        salesRate: "66.00",
        purchaseRate: "61.50",
        salesRateTypeId: kgRate,
        purchaseRateTypeId: kgRate,
        measureUnitCode: "KG",
      },
      {
        itemGroupName: "Galvanized Plain Sheets",
        shortName: "GP-SHT",
        metalTypeId: msId,
        salesRate: "72000.00",
        purchaseRate: "68000.00",
        salesRateTypeId: tonRate,
        purchaseRateTypeId: tonRate,
        measureUnitCode: "TON",
      },
      {
        itemGroupName: "TMT Rebars Fe500D",
        shortName: "TMT-500",
        metalTypeId: msId,
        salesRate: "52500.00",
        purchaseRate: "49000.00",
        salesRateTypeId: tonRate,
        purchaseRateTypeId: tonRate,
        measureUnitCode: "TON",
      },
      {
        itemGroupName: "Stainless Steel Seamless Pipes",
        shortName: "SS-SP",
        metalTypeId: ssId,
        salesRate: "450.00",
        purchaseRate: "390.00",
        salesRateTypeId: meterRate,
        purchaseRateTypeId: meterRate,
        measureUnitCode: "MTR",
      },
      {
        itemGroupName: "Mild Steel Equal Angles",
        shortName: "MS-ANG",
        metalTypeId: msId,
        salesRate: "55.00",
        purchaseRate: "50.00",
        salesRateTypeId: kgRate,
        purchaseRateTypeId: kgRate,
        measureUnitCode: "KG",
      },
      {
        itemGroupName: "Carbon Steel Heavy Plates",
        shortName: "CS-PLT",
        metalTypeId: csId,
        salesRate: "64000.00",
        purchaseRate: "59500.00",
        salesRateTypeId: tonRate,
        purchaseRateTypeId: tonRate,
        measureUnitCode: "TON",
      },
      {
        itemGroupName: "Alloy Steel Round Bars",
        shortName: "AS-RB",
        metalTypeId: asId,
        salesRate: "88.00",
        purchaseRate: "80.00",
        salesRateTypeId: kgRate,
        purchaseRateTypeId: kgRate,
        measureUnitCode: "KG",
      },
      {
        itemGroupName: "Cast Iron Billets",
        shortName: "CI-BLT",
        metalTypeId: irId,
        salesRate: "42000.00",
        purchaseRate: "38500.00",
        salesRateTypeId: tonRate,
        purchaseRateTypeId: tonRate,
        measureUnitCode: "TON",
      },
      {
        itemGroupName: "Stainless Steel Flanges",
        shortName: "SS-FLG",
        metalTypeId: ssId,
        salesRate: "850.00",
        purchaseRate: "720.00",
        salesRateTypeId: pcsRate,
        purchaseRateTypeId: pcsRate,
        measureUnitCode: "PCS",
      },
      {
        itemGroupName: "Structural Steel Channels",
        shortName: "ISMC",
        metalTypeId: msId,
        salesRate: "620.00",
        purchaseRate: "560.00",
        salesRateTypeId: meterRate,
        purchaseRateTypeId: meterRate,
        measureUnitCode: "MTR",
      },
      {
        itemGroupName: "High Carbon Wire Rods",
        shortName: "WR-HC",
        metalTypeId: csId,
        salesRate: "60.00",
        purchaseRate: "55.00",
        salesRateTypeId: kgRate,
        purchaseRateTypeId: kgRate,
        measureUnitCode: "KG",
      },
      {
        itemGroupName: "ERW Steel Tubes",
        shortName: "ERW-TB",
        metalTypeId: msId,
        salesRate: "280.00",
        purchaseRate: "240.00",
        salesRateTypeId: meterRate,
        purchaseRateTypeId: meterRate,
        measureUnitCode: "MTR",
      },
      {
        itemGroupName: "Chequered Floor Plates",
        shortName: "CHQ-PLT",
        metalTypeId: msId,
        salesRate: "350.00",
        purchaseRate: "310.00",
        salesRateTypeId: sqftRate,
        purchaseRateTypeId: sqftRate,
        measureUnitCode: "SQFT",
      },
      {
        itemGroupName: "Bright Hexagon Bars",
        shortName: "HEX-BR",
        metalTypeId: asId,
        salesRate: "95.00",
        purchaseRate: "86.00",
        salesRateTypeId: kgRate,
        purchaseRateTypeId: kgRate,
        measureUnitCode: "KG",
      },
      {
        itemGroupName: "Mild Steel Flat Bars",
        shortName: "MS-FB",
        metalTypeId: msId,
        salesRate: "53.00",
        purchaseRate: "48.50",
        salesRateTypeId: kgRate,
        purchaseRateTypeId: kgRate,
        measureUnitCode: "KG",
      },
      {
        itemGroupName: "Stainless Steel Square Bars",
        shortName: "SS-SB",
        metalTypeId: ssId,
        salesRate: "210.00",
        purchaseRate: "185.00",
        salesRateTypeId: kgRate,
        purchaseRateTypeId: kgRate,
        measureUnitCode: "KG",
      },
      {
        itemGroupName: "Heavy Universal Beams",
        shortName: "UB-HV",
        metalTypeId: msId,
        salesRate: "1450.00",
        purchaseRate: "1320.00",
        salesRateTypeId: meterRate,
        purchaseRateTypeId: meterRate,
        measureUnitCode: "MTR",
      },
      {
        itemGroupName: "Alloy Steel Hollow Sections",
        shortName: "AS-HS",
        metalTypeId: asId,
        salesRate: "520.00",
        purchaseRate: "460.00",
        salesRateTypeId: meterRate,
        purchaseRateTypeId: meterRate,
        measureUnitCode: "MTR",
      },
      {
        itemGroupName: "Foundry Grade Pig Iron",
        shortName: "PI-FG",
        metalTypeId: irId,
        salesRate: "39000.00",
        purchaseRate: "36000.00",
        salesRateTypeId: tonRate,
        purchaseRateTypeId: tonRate,
        measureUnitCode: "TON",
      },
      {
        itemGroupName: "Galvanized Corrugated Sheets",
        shortName: "GC-SHT",
        metalTypeId: msId,
        salesRate: "780.00",
        purchaseRate: "710.00",
        salesRateTypeId: meterRate,
        purchaseRateTypeId: meterRate,
        measureUnitCode: "MTR",
      },
      {
        itemGroupName: "Stainless Steel Angle Bars",
        shortName: "SS-ANG",
        metalTypeId: ssId,
        salesRate: "195.00",
        purchaseRate: "172.00",
        salesRateTypeId: kgRate,
        purchaseRateTypeId: kgRate,
        measureUnitCode: "KG",
      },
    ];

    for (const group of itemGroupsList) {
      await db
        .insert(itemGroups)
        .values(group)
        .onConflictDoNothing({ target: itemGroups.itemGroupName });
    }

    // 10. Seeding Items (24 Items)
    console.log("Seeding items (24 items)...");
    const attrNameToId = new Map(
      existingCommonLists
        .filter((c) => c.listType === CommonListType.ATTRIBUTE)
        .map((a) => [a.listValue, a.id]),
    );

    const gradeId = attrNameToId.get("Grade") || 11;
    const diaId = attrNameToId.get("Diameter") || 12;
    const thickId = attrNameToId.get("Thickness") || 13;
    const widthId = attrNameToId.get("Width") || 14;
    const lenId = attrNameToId.get("Length") || 15;
    const shapeId = attrNameToId.get("Shape") || 16;
    const stdId = attrNameToId.get("Standard") || 17;

    const itemsList = [
      {
        itemName: "TMT Bar 12mm Fe500D",
        shortName: "TMT-12-500D",
        isActive: true,
        attributes: [gradeId, diaId, lenId, stdId],
      },
      {
        itemName: "TMT Bar 16mm Fe500D",
        shortName: "TMT-16-500D",
        isActive: true,
        attributes: [gradeId, diaId, lenId, stdId],
      },
      {
        itemName: "TMT Bar 20mm Fe550",
        shortName: "TMT-20-550",
        isActive: true,
        attributes: [gradeId, diaId, lenId, stdId],
      },
      {
        itemName: "TMT Bar 25mm Fe550",
        shortName: "TMT-25-550",
        isActive: true,
        attributes: [gradeId, diaId, lenId, stdId],
      },
      {
        itemName: "TMT Bar 32mm Fe550D",
        shortName: "TMT-32-550D",
        isActive: true,
        attributes: [gradeId, diaId, lenId, stdId],
      },
      {
        itemName: "SS Seamless Pipe 2 inch Sch40",
        shortName: "SS-SP-2IN",
        isActive: true,
        attributes: [thickId, lenId, shapeId, stdId],
      },
      {
        itemName: "SS Seamless Pipe 3 inch Sch40",
        shortName: "SS-SP-3IN",
        isActive: true,
        attributes: [thickId, lenId, shapeId, stdId],
      },
      {
        itemName: "SS Seamless Pipe 4 inch Sch80",
        shortName: "SS-SP-4IN",
        isActive: true,
        attributes: [thickId, lenId, shapeId, stdId],
      },
      {
        itemName: "MS Equal Angle 50x50x5 mm",
        shortName: "MS-ANG-50-5",
        isActive: true,
        attributes: [thickId, widthId, lenId, shapeId],
      },
      {
        itemName: "MS Equal Angle 75x75x6 mm",
        shortName: "MS-ANG-75-6",
        isActive: true,
        attributes: [thickId, widthId, lenId, shapeId],
      },
      {
        itemName: "MS Equal Angle 100x100x10 mm",
        shortName: "MS-ANG-100-10",
        isActive: true,
        attributes: [thickId, widthId, lenId, shapeId],
      },
      {
        itemName: "Carbon Steel Plate 10mm IS2062",
        shortName: "CS-PLT-10MM",
        isActive: true,
        attributes: [thickId, widthId, lenId, stdId],
      },
      {
        itemName: "Carbon Steel Plate 16mm IS2062",
        shortName: "CS-PLT-16MM",
        isActive: true,
        attributes: [thickId, widthId, lenId, stdId],
      },
      {
        itemName: "Carbon Steel Plate 25mm IS2062",
        shortName: "CS-PLT-25MM",
        isActive: true,
        attributes: [thickId, widthId, lenId, stdId],
      },
      {
        itemName: "Hot Rolled Sheet 2.5mm",
        shortName: "HRS-2.5MM",
        isActive: true,
        attributes: [thickId, widthId, lenId],
      },
      {
        itemName: "Hot Rolled Sheet 3.0mm",
        shortName: "HRS-3.0MM",
        isActive: true,
        attributes: [thickId, widthId, lenId],
      },
      {
        itemName: "Cold Rolled Sheet 1.2mm",
        shortName: "CRS-1.2MM",
        isActive: true,
        attributes: [thickId, widthId, lenId],
      },
      {
        itemName: "Cold Rolled Sheet 1.6mm",
        shortName: "CRS-1.6MM",
        isActive: true,
        attributes: [thickId, widthId, lenId],
      },
      {
        itemName: "MS Channel ISMC 150",
        shortName: "MS-CH-150",
        isActive: true,
        attributes: [widthId, lenId, shapeId, stdId],
      },
      {
        itemName: "MS Channel ISMC 200",
        shortName: "MS-CH-200",
        isActive: true,
        attributes: [widthId, lenId, shapeId, stdId],
      },
      {
        itemName: "SS Blind Flange 4 inch Class 150",
        shortName: "SS-FLG-4IN",
        isActive: true,
        attributes: [diaId, thickId, stdId],
      },
      {
        itemName: "Alloy Steel Round Bar 32mm",
        shortName: "AS-RB-32MM",
        isActive: true,
        attributes: [gradeId, diaId, lenId, shapeId],
      },
      {
        itemName: "Alloy Steel Round Bar 50mm",
        shortName: "AS-RB-50MM",
        isActive: true,
        attributes: [gradeId, diaId, lenId, shapeId],
      },
      {
        itemName: "Chequered Floor Plate 6mm",
        shortName: "CHQ-6MM",
        isActive: true,
        attributes: [thickId, widthId, lenId, shapeId],
      },
    ];

    for (const item of itemsList) {
      await db
        .insert(items)
        .values(item)
        .onConflictDoNothing({ target: items.shortName });
    }

    // 11. Seeding Accounts (115 Accounts)
    console.log("Seeding accounts (115 accounts)...");

    const currentAssetsId = accountGroupMap.get("Current Assets") || 1;
    const fixedAssetsId = accountGroupMap.get("Fixed Assets") || 2;
    const currentLiabilitiesId =
      accountGroupMap.get("Current Liabilities") || 3;
    const longTermLiabilitiesId =
      accountGroupMap.get("Long Term Liabilities") || 4;
    const capitalAccountId = accountGroupMap.get("Capital Account") || 5;
    const retainedEarningsId = accountGroupMap.get("Retained Earnings") || 6;
    const directIncomeId = accountGroupMap.get("Direct Income") || 7;
    const indirectIncomeId = accountGroupMap.get("Indirect Income") || 8;
    const directExpenseId = accountGroupMap.get("Direct Expense") || 9;
    const indirectExpenseId = accountGroupMap.get("Indirect Expense") || 10;

    const rawAccounts = [
      {
        name: "Apex Steel Corporation",
        fn: "Rajesh",
        mn: "K",
        ln: "Mehta",
        user: "apex_steel",
        mail: "accounts@apexsteel.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Gujarat Infrastructure Ltd",
        fn: "Hiren",
        mn: "B",
        ln: "Patel",
        user: "gujarat_infra",
        mail: "finance@gujinfra.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Bharat Heavy Structurals",
        fn: "Suresh",
        mn: "R",
        ln: "Sharma",
        user: "bharat_struct",
        mail: "info@bharatstruct.in",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Sunrise Engineering Works",
        fn: "Sunil",
        mn: "P",
        ln: "Joshi",
        user: "sunrise_eng",
        mail: "contact@sunriseeng.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Metro Concretes & Precast",
        fn: "Vikram",
        mn: "S",
        ln: "Verma",
        user: "metro_concretes",
        mail: "billing@metroconcretes.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Kirloskar Fabrications",
        fn: "Anil",
        mn: "D",
        ln: "Kirloskar",
        user: "kirloskar_fab",
        mail: "procure@kirloskarfab.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "L&T Western Project Site",
        fn: "Manoj",
        mn: "T",
        ln: "Nair",
        user: "lt_western",
        mail: "lt_west@larsentoubro.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Jindal Urban Infra",
        fn: "Prashant",
        mn: "N",
        ln: "Jindal",
        user: "jindal_urban",
        mail: "accounts@jindalinfra.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Shapoorji Construction Hub",
        fn: "Cyrus",
        mn: "E",
        ln: "Mistry",
        user: "shapoorji_hub",
        mail: "orders@shapoorjicon.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Ashoka Buildcon Highway Div",
        fn: "Dinesh",
        mn: "L",
        ln: "Deshmukh",
        user: "ashoka_buildcon",
        mail: "highways@ashokabuildcon.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Godrej Heavy Industries",
        fn: "Adi",
        mn: "J",
        ln: "Godrej",
        user: "godrej_heavy",
        mail: "supplies@godrejheavy.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "DLF Urban City Project",
        fn: "Kushal",
        mn: "P",
        ln: "Singh",
        user: "dlf_urban",
        mail: "procure@dlfcity.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "NCC Infrastructure Ltd",
        fn: "Ranga",
        mn: "A",
        ln: "Rao",
        user: "ncc_infra",
        mail: "finance@nccinfra.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "GMR Expressways Division",
        fn: "Gautam",
        mn: "M",
        ln: "Reddy",
        user: "gmr_express",
        mail: "express@gmrgroup.in",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Afcons Infrastructure",
        fn: "Sandeep",
        mn: "G",
        ln: "Garg",
        user: "afcons_infra",
        mail: "materials@afcons.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Gammon Bridge Works",
        fn: "Harish",
        mn: "C",
        ln: "Patil",
        user: "gammon_bridge",
        mail: "bridges@gammoninfra.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "IRB Tollways Construction",
        fn: "Virendra",
        mn: "D",
        ln: "Mhaiskar",
        user: "irb_tollways",
        mail: "tollways@irb.co.in",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Tata Power Transmission",
        fn: "Ratan",
        mn: "K",
        ln: "Tata",
        user: "tata_trans",
        mail: "transmission@tatapower.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Ahluwalia Contracts India",
        fn: "Bikram",
        mn: "S",
        ln: "Ahluwalia",
        user: "ahluwalia_con",
        mail: "accounts@ahluwaliacontracts.in",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Simplex Pipelines Corp",
        fn: "Amitabh",
        mn: "V",
        ln: "Mundhra",
        user: "simplex_pipe",
        mail: "pipelines@simplexinfra.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "PNC Infratech Projects",
        fn: "Pradeep",
        mn: "K",
        ln: "Jain",
        user: "pnc_infra",
        mail: "billing@pncinfratech.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Welspun Tubular Products",
        fn: "Balkrishan",
        mn: "K",
        ln: "Goenka",
        user: "welspun_tubes",
        mail: "tubes@welspun.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Mahindra Heavy Auto Components",
        fn: "Anand",
        mn: "G",
        ln: "Mahindra",
        user: "mahindra_auto",
        mail: "auto_metals@mahindra.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "BHEL Power Boiler Works",
        fn: "Nalin",
        mn: "S",
        ln: "Shinghal",
        user: "bhel_power",
        mail: "boilers@bhel.in",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Thermax Energy Solutions",
        fn: "Meher",
        mn: "P",
        ln: "Pudumjee",
        user: "thermax_energy",
        mail: "energy@thermaxglobal.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Isgec Heavy Engineering",
        fn: "Aditya",
        mn: "P",
        ln: "Puri",
        user: "isgec_eng",
        mail: "heavy@isgec.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Pennar Engineered Buildings",
        fn: "Nrupender",
        mn: "R",
        ln: "Rao",
        user: "pennar_build",
        mail: "peb@pennarindia.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Kirby Building Systems",
        fn: "Raju",
        mn: "V",
        ln: "Kurian",
        user: "kirby_sys",
        mail: "orders@kirby-india.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Everest Steel Structures",
        fn: "Manish",
        mn: "K",
        ln: "Sanghi",
        user: "everest_steel",
        mail: "structures@everestind.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Interarch Building Products",
        fn: "Arvind",
        mn: "N",
        ln: "Nanda",
        user: "interarch_prod",
        mail: "info@interarchindia.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Sterling & Wilson EPC",
        fn: "Khurshed",
        mn: "Y",
        ln: "Daruvala",
        user: "sterling_epc",
        mail: "epc@sterlingwilson.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Kalpataru Power Tower Unit",
        fn: "Mofatraj",
        mn: "P",
        ln: "Munot",
        user: "kalpataru_power",
        mail: "towers@kalpatarupower.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "KEC International Line Works",
        fn: "Vimal",
        mn: "K",
        ln: "Kejriwal",
        user: "kec_inter",
        mail: "lineworks@kecrpg.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Techno Electric Transmission",
        fn: "Padam",
        mn: "P",
        ln: "Gupta",
        user: "techno_electric",
        mail: "accounts@techno.co.in",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Bajaj Electricals Tower Div",
        fn: "Shekhar",
        mn: "R",
        ln: "Bajaj",
        user: "bajaj_towers",
        mail: "towers@bajajelectricals.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Tata AutoComp Systems",
        fn: "Arvind",
        mn: "S",
        ln: "Goel",
        user: "tata_autocomp",
        mail: "purchasing@tataautocomp.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Bharat Forge Machining Plant",
        fn: "Babasaheb",
        mn: "N",
        ln: "Kalyani",
        user: "bharat_forge",
        mail: "machining@bharatforge.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Ramkrishna Forgings Ltd",
        fn: "Mahabir",
        mn: "P",
        ln: "Jalan",
        user: "ramkrishna_forg",
        mail: "sales@ramkrishnaforgings.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "MM Forgings Heavy Div",
        fn: "Vidyashankar",
        mn: "K",
        ln: "Krishnan",
        user: "mm_forgings",
        mail: "heavy@mmforgings.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Sundram Fasteners Unit 4",
        fn: "Suresh",
        mn: "K",
        ln: "Krishna",
        user: "sundram_fasteners",
        mail: "unit4@sundram.com",
        type: assetId,
        grp: currentAssetsId,
      },

      // --- Banks & Cash Accounts (Current Assets) (10 accounts) ---
      {
        name: "State Bank of India - CA 1029",
        fn: "Sanjay",
        mn: "B",
        ln: "Verma",
        user: "sbi_ca_1029",
        mail: "sbi_1029@matrixcorp.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "HDFC Bank - CA 4401",
        fn: "Rohit",
        mn: "P",
        ln: "Shenoy",
        user: "hdfc_ca_4401",
        mail: "hdfc_4401@matrixcorp.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "ICICI Bank - CA 8820",
        fn: "Girish",
        mn: "M",
        ln: "Nambiar",
        user: "icici_ca_8820",
        mail: "icici_8820@matrixcorp.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Axis Bank - CA 3105",
        fn: "Anand",
        mn: "K",
        ln: "Iyer",
        user: "axis_ca_3105",
        mail: "axis_3105@matrixcorp.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Bank of Baroda - CA 9012",
        fn: "Naveen",
        mn: "C",
        ln: "Bhatt",
        user: "bob_ca_9012",
        mail: "bob_9012@matrixcorp.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Kotak Mahindra Bank - CA 5519",
        fn: "Kavita",
        mn: "R",
        ln: "Kothari",
        user: "kotak_ca_5519",
        mail: "kotak_5519@matrixcorp.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Punjab National Bank - CA 7731",
        fn: "Deepak",
        mn: "J",
        ln: "Aggarwal",
        user: "pnb_ca_7731",
        mail: "pnb_7731@matrixcorp.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Petty Cash - Factory Plant 1",
        fn: "Mahesh",
        mn: "D",
        ln: "Gaikwad",
        user: "cash_factory1",
        mail: "cash1@matrixcorp.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Petty Cash - Factory Plant 2",
        fn: "Ramesh",
        mn: "S",
        ln: "Yadav",
        user: "cash_factory2",
        mail: "cash2@matrixcorp.com",
        type: assetId,
        grp: currentAssetsId,
      },
      {
        name: "Petty Cash - Head Office",
        fn: "Pooja",
        mn: "A",
        ln: "Sharma",
        user: "cash_headoffice",
        mail: "cash_ho@matrixcorp.com",
        type: assetId,
        grp: currentAssetsId,
      },

      // --- Fixed Assets (8 accounts) ---
      {
        name: "Rolling Mill Plant & Machinery",
        fn: "Kailash",
        mn: "T",
        ln: "Chauhan",
        user: "asset_mill_machinery",
        mail: "asset_machinery@matrixcorp.com",
        type: assetId,
        grp: fixedAssetsId,
      },
      {
        name: "Induction Melting Furnace Unit",
        fn: "Bhagwan",
        mn: "L",
        ln: "Tiwari",
        user: "asset_furnace",
        mail: "asset_furnace@matrixcorp.com",
        type: assetId,
        grp: fixedAssetsId,
      },
      {
        name: "Heavy Transportation Fleet",
        fn: "Jaswant",
        mn: "S",
        ln: "Dhillon",
        user: "asset_trucks",
        mail: "asset_trucks@matrixcorp.com",
        type: assetId,
        grp: fixedAssetsId,
      },
      {
        name: "Factory Freehold Land & Sheds",
        fn: "Nitin",
        mn: "V",
        ln: "Gadkari",
        user: "asset_land_sheds",
        mail: "asset_land@matrixcorp.com",
        type: assetId,
        grp: fixedAssetsId,
      },
      {
        name: "Corporate Office Premises",
        fn: "Sharad",
        mn: "K",
        ln: "Pawar",
        user: "asset_corp_office",
        mail: "asset_office@matrixcorp.com",
        type: assetId,
        grp: fixedAssetsId,
      },
      {
        name: "Electric Overhead Cranes (EOT)",
        fn: "Balwant",
        mn: "R",
        ln: "Singh",
        user: "asset_eot_cranes",
        mail: "asset_cranes@matrixcorp.com",
        type: assetId,
        grp: fixedAssetsId,
      },
      {
        name: "Metallurgical Testing Lab Setup",
        fn: "Dr. Aniruddh",
        mn: "V",
        ln: "Bose",
        user: "asset_lab_setup",
        mail: "asset_lab@matrixcorp.com",
        type: assetId,
        grp: fixedAssetsId,
      },
      {
        name: "Automated Weighbridge 100T",
        fn: "Devendra",
        mn: "P",
        ln: "Shukla",
        user: "asset_weighbridge",
        mail: "asset_weighbridge@matrixcorp.com",
        type: assetId,
        grp: fixedAssetsId,
      },

      // --- Sundry Creditors / Suppliers (Current Liabilities) (25 accounts) ---
      {
        name: "Steel Authority of India Ltd (SAIL)",
        fn: "Amarendu",
        mn: "K",
        ln: "Prakash",
        user: "sail_raw_supplies",
        mail: "central_orders@sail.in",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "JSW Steel Distribution Center",
        fn: "Jayant",
        mn: "V",
        ln: "Acharya",
        user: "jsw_distribution",
        mail: "dist_west@jsw.in",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Tata Steel BSL Raw Materials",
        fn: "T. V.",
        mn: "K",
        ln: "Narendran",
        user: "tata_bsl_raw",
        mail: "bsl_raw@tatasteel.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Jindal Steel & Power Ltd",
        fn: "Naveen",
        mn: "O",
        ln: "Jindal",
        user: "jspl_supplies",
        mail: "orders@jindalsteel.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Essar Steel Processing Stockyard",
        fn: "Prashant",
        mn: "S",
        ln: "Ruin",
        user: "essar_stockyard",
        mail: "stockyard@essar.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Vedanta Metal Resource Corp",
        fn: "Anil",
        mn: "L",
        ln: "Agarwal",
        user: "vedanta_metals",
        mail: "metal_supplies@vedanta.co.in",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Hindalco Smelting Anodes",
        fn: "Satish",
        mn: "M",
        ln: "Pai",
        user: "hindalco_anodes",
        mail: "anodes@adityabirla.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Nalco Bauxite & Metal Supplies",
        fn: "Sridhar",
        mn: "K",
        ln: "Patra",
        user: "nalco_supplies",
        mail: "bauxite@nalcoindia.co.in",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Rashtriya Ispat Nigam Ltd (RINL)",
        fn: "Atul",
        mn: "B",
        ln: "Bhatt",
        user: "rinl_vizag",
        mail: "vizag_steel@rinl.gov.in",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Electrosteel Castings Depot",
        fn: "Umang",
        mn: "K",
        ln: "Kejriwal",
        user: "electrosteel_depot",
        mail: "castings@electrosteel.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Shyam Metalics Sponge Iron",
        fn: "Brij",
        mn: "B",
        ln: "Agarwal",
        user: "shyam_metalics",
        mail: "sponge@shyammetalics.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Sarda Energy & Minerals",
        fn: "Kamal",
        mn: "K",
        ln: "Sarda",
        user: "sarda_energy",
        mail: "minerals@seml.co.in",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Gallantt Metal Billet Suppliers",
        fn: "Chandra",
        mn: "P",
        ln: "Agarwal",
        user: "gallantt_metal",
        mail: "billets@gallantt.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Sunflag Iron & Steel Works",
        fn: "Ravi",
        mn: "B",
        ln: "Bhardwaj",
        user: "sunflag_iron",
        mail: "orders@sunflagsteel.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Prakash Industries Wire Rods",
        fn: "Vipin",
        mn: "P",
        ln: "Agarwal",
        user: "prakash_ind",
        mail: "wires@prakash.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Lloyds Metals & Energy",
        fn: "Mukesh",
        mn: "R",
        ln: "Gupta",
        user: "lloyds_metals",
        mail: "pellets@lloyds.in",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Kirloskar Ferrous Industries",
        fn: "R. V.",
        mn: "S",
        ln: "Gumaste",
        user: "kirloskar_ferrous",
        mail: "pigiron@kirloskar.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Jindal Stainless Stockist",
        fn: "Abhyuday",
        mn: "P",
        ln: "Jindal",
        user: "jindal_stainless",
        mail: "stockist@jindalstainless.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Viraj Profiles Wire Plant",
        fn: "Neeraj",
        mn: "R",
        ln: "Kochhar",
        user: "viraj_profiles",
        mail: "wireplant@viraj.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Mukul Scrap Merchants Hub",
        fn: "Mukul",
        mn: "D",
        ln: "Bansal",
        user: "mukul_scrap",
        mail: "dealers@mukulscrap.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "National Oxygen & Gas Refills",
        fn: "Sudhir",
        mn: "T",
        ln: "Singhal",
        user: "national_gas",
        mail: "orders@nationalgas.in",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Industrial Lubricants & Oils",
        fn: "Pravin",
        mn: "H",
        ln: "Parekh",
        user: "ind_lubricants",
        mail: "sales@indlubricants.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Tayo Rolls Refractory Linings",
        fn: "Kallol",
        mn: "N",
        ln: "Chatterjee",
        user: "tayo_rolls",
        mail: "refractory@tayorolls.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Orient Abrasives Grinding Unit",
        fn: "Manubhai",
        mn: "G",
        ln: "Patel",
        user: "orient_abrasives",
        mail: "grinding@orientabrasives.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Carborundum Universal Wheels",
        fn: "M. M.",
        mn: "C",
        ln: "Murugappan",
        user: "cumi_wheels",
        mail: "wheels@cumi.murugappa.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },

      // --- Statutory / Current Liabilities (5 accounts) ---
      {
        name: "Goods & Services Tax (GST) Payable",
        fn: "Superintendent",
        mn: "CGST",
        ln: "Division",
        user: "gst_payable",
        mail: "gst_dept@matrixcorp.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Tax Deducted at Source (TDS) Payable",
        fn: "Income",
        mn: "Tax",
        ln: "Officer",
        user: "tds_payable",
        mail: "tds_dept@matrixcorp.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Factory Workers Wages Payable",
        fn: "HR",
        mn: "Plant",
        ln: "Officer",
        user: "wages_payable",
        mail: "wages_hr@matrixcorp.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Employees Provident Fund (PF) Payable",
        fn: "EPFO",
        mn: "Regional",
        ln: "Commissioner",
        user: "pf_payable",
        mail: "pf_officer@matrixcorp.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },
      {
        name: "Statutory Audit Fee Payable",
        fn: "S. R.",
        mn: "Batliboi",
        ln: "& Associates",
        user: "audit_fee_payable",
        mail: "batliboi_audit@matrixcorp.com",
        type: liabilityId,
        grp: currentLiabilitiesId,
      },

      // --- Long Term Liabilities (4 accounts) ---
      {
        name: "SBI Term Loan - Rolling Mill Expansion",
        fn: "General",
        mn: "Manager",
        ln: "SME SBI",
        user: "sbi_term_loan",
        mail: "sbi_loan@matrixcorp.com",
        type: liabilityId,
        grp: longTermLiabilitiesId,
      },
      {
        name: "HDFC Industrial Equipment Mortgage",
        fn: "Credit",
        mn: "Head",
        ln: "HDFC Infra",
        user: "hdfc_mortgage",
        mail: "hdfc_loan@matrixcorp.com",
        type: liabilityId,
        grp: longTermLiabilitiesId,
      },
      {
        name: "SIDBI Green Furnace Credit Line",
        fn: "Zonal",
        mn: "Head",
        ln: "SIDBI CleanTech",
        user: "sidbi_green_loan",
        mail: "sidbi_loan@matrixcorp.com",
        type: liabilityId,
        grp: longTermLiabilitiesId,
      },
      {
        name: "Unsecured Promoter Directors Loan",
        fn: "Karan",
        mn: "H",
        ln: "Harsora",
        user: "promoter_loan",
        mail: "promoter_loan@matrixcorp.com",
        type: liabilityId,
        grp: longTermLiabilitiesId,
      },

      // --- Capital & Equity Accounts (3 accounts) ---
      {
        name: "Equity Share Capital Account",
        fn: "Managing",
        mn: "Director",
        ln: "Board",
        user: "equity_capital",
        mail: "board@matrixcorp.com",
        type: equityId,
        grp: capitalAccountId,
      },
      {
        name: "General Reserve & Surplus",
        fn: "Chief",
        mn: "Financial",
        ln: "Officer",
        user: "general_reserve",
        mail: "reserve@matrixcorp.com",
        type: equityId,
        grp: retainedEarningsId,
      },
      {
        name: "Retained Earnings P&L Account",
        fn: "Corporate",
        mn: "Finance",
        ln: "Controller",
        user: "retained_earnings",
        mail: "controller@matrixcorp.com",
        type: equityId,
        grp: retainedEarningsId,
      },

      // --- Direct Income Accounts (5 accounts) ---
      {
        name: "Domestic Steel Rebars Revenue",
        fn: "Sales",
        mn: "Head",
        ln: "Domestic",
        user: "rev_rebars",
        mail: "sales_domestic@matrixcorp.com",
        type: incomeId,
        grp: directIncomeId,
      },
      {
        name: "HR / CR Coil Sales Revenue",
        fn: "Sales",
        mn: "Head",
        ln: "Flat Products",
        user: "rev_coils",
        mail: "sales_coils@matrixcorp.com",
        type: incomeId,
        grp: directIncomeId,
      },
      {
        name: "Structural Beams & Channels Sales",
        fn: "Sales",
        mn: "Head",
        ln: "Structurals",
        user: "rev_structurals",
        mail: "sales_struct@matrixcorp.com",
        type: incomeId,
        grp: directIncomeId,
      },
      {
        name: "Industrial Pipe & Flange Revenue",
        fn: "Sales",
        mn: "Head",
        ln: "Tubular",
        user: "rev_pipes",
        mail: "sales_pipes@matrixcorp.com",
        type: incomeId,
        grp: directIncomeId,
      },
      {
        name: "Custom Steel Fabrication Charges",
        fn: "Works",
        mn: "Manager",
        ln: "CustomFab",
        user: "rev_fabrication",
        mail: "custom_fab@matrixcorp.com",
        type: incomeId,
        grp: directIncomeId,
      },

      // --- Indirect Income Accounts (4 accounts) ---
      {
        name: "Metal Scrap & Slag Disposal Income",
        fn: "Yard",
        mn: "Supervisor",
        ln: "Recycling",
        user: "inc_scrap_sales",
        mail: "scrap_revenue@matrixcorp.com",
        type: incomeId,
        grp: indirectIncomeId,
      },
      {
        name: "Interest on Bank Term Deposits",
        fn: "Treasury",
        mn: "Officer",
        ln: "Banking",
        user: "inc_fd_interest",
        mail: "treasury@matrixcorp.com",
        type: incomeId,
        grp: indirectIncomeId,
      },
      {
        name: "Cash Discounts Received from Vendors",
        fn: "Accounts",
        mn: "Payable",
        ln: "Head",
        user: "inc_vendor_discount",
        mail: "discounts@matrixcorp.com",
        type: incomeId,
        grp: indirectIncomeId,
      },
      {
        name: "Foreign Exchange Realization Gain",
        fn: "Forex",
        mn: "Dealer",
        ln: "Treasury",
        user: "inc_forex_gain",
        mail: "forex@matrixcorp.com",
        type: incomeId,
        grp: indirectIncomeId,
      },

      // --- Direct Expense Accounts (6 accounts) ---
      {
        name: "Raw Billets & Sponge Iron Purchase",
        fn: "Purchase",
        mn: "Head",
        ln: "RawMaterials",
        user: "exp_raw_materials",
        mail: "purchase_raw@matrixcorp.com",
        type: expenseId,
        grp: directExpenseId,
      },
      {
        name: "High Tension Industrial Electricity",
        fn: "State",
        mn: "Electricity",
        ln: "Board",
        user: "exp_ht_power",
        mail: "power_billing@matrixcorp.com",
        type: expenseId,
        grp: directExpenseId,
      },
      {
        name: "Furnace Gas & Fuel Oil",
        fn: "Fuel",
        mn: "Logistics",
        ln: "Manager",
        user: "exp_furnace_fuel",
        mail: "furnace_fuel@matrixcorp.com",
        type: expenseId,
        grp: directExpenseId,
      },
      {
        name: "Factory Floor Rolling Wages",
        fn: "Plant",
        mn: "Operations",
        ln: "Manager",
        user: "exp_rolling_wages",
        mail: "rolling_ops@matrixcorp.com",
        type: expenseId,
        grp: directExpenseId,
      },
      {
        name: "Inward Freight & Logistics Costs",
        fn: "Transport",
        mn: "Coordinator",
        ln: "Logistics",
        user: "exp_inward_freight",
        mail: "inward_freight@matrixcorp.com",
        type: expenseId,
        grp: directExpenseId,
      },
      {
        name: "Rolling Mill Rollers & Consumables",
        fn: "Store",
        mn: "Incharge",
        ln: "Toolroom",
        user: "exp_consumables",
        mail: "toolroom@matrixcorp.com",
        type: expenseId,
        grp: directExpenseId,
      },

      // --- Indirect Expense Accounts (8 accounts) ---
      {
        name: "Corporate Administrative Salaries",
        fn: "Chief",
        mn: "HR",
        ln: "Officer",
        user: "exp_admin_salaries",
        mail: "hr_admin@matrixcorp.com",
        type: expenseId,
        grp: indirectExpenseId,
      },
      {
        name: "Corporate Head Office Lease Rent",
        fn: "Commercial",
        mn: "Properties",
        ln: "Manager",
        user: "exp_ho_rent",
        mail: "office_lease@matrixcorp.com",
        type: expenseId,
        grp: indirectExpenseId,
      },
      {
        name: "Industrial Plant & Stock Insurance",
        fn: "New",
        mn: "India",
        ln: "Assurance",
        user: "exp_plant_insurance",
        mail: "insurance@matrixcorp.com",
        type: expenseId,
        grp: indirectExpenseId,
      },
      {
        name: "Plant Repair & Preventive Maintenance",
        fn: "Chief",
        mn: "Engineer",
        ln: "Maintenance",
        user: "exp_repair_maint",
        mail: "maintenance@matrixcorp.com",
        type: expenseId,
        grp: indirectExpenseId,
      },
      {
        name: "Sales & Marketing Promotion Expenses",
        fn: "Marketing",
        mn: "Head",
        ln: "SteelExpo",
        user: "exp_marketing_promo",
        mail: "marketing_exp@matrixcorp.com",
        type: expenseId,
        grp: indirectExpenseId,
      },
      {
        name: "Legal & Regulatory Compliance Fees",
        fn: "Legal",
        mn: "Counsel",
        ln: "Advisors",
        user: "exp_legal_fees",
        mail: "legal_dept@matrixcorp.com",
        type: expenseId,
        grp: indirectExpenseId,
      },
      {
        name: "Corporate IT & Cloud ERP Infrastructure",
        fn: "Chief",
        mn: "Technology",
        ln: "Officer",
        user: "exp_it_cloud",
        mail: "it_infra@matrixcorp.com",
        type: expenseId,
        grp: indirectExpenseId,
      },
      {
        name: "Bank Processing Charges & Commission",
        fn: "Bank",
        mn: "Relationship",
        ln: "Manager",
        user: "exp_bank_charges",
        mail: "bank_charges@matrixcorp.com",
        type: expenseId,
        grp: indirectExpenseId,
      },
    ];

    for (let i = 0; i < rawAccounts.length; i++) {
      const a = rawAccounts[i];
      if (!a) continue;
      // Mark a couple accounts as inactive (e.g. 5%) for filtering tests in the UI
      const isActive = i % 20 !== 19;

      await db
        .insert(accounts)
        .values({
          accountName: a.name,
          firstName: a.fn,
          middleName: a.mn,
          lastName: a.ln,
          userName: a.user,
          email: a.mail,
          accountTypeId: a.type,
          accountGroupId: a.grp,
          isActive,
        })
        .onConflictDoNothing({ target: accounts.userName });
    }

    // 12. Seeding Daybook Groups
    console.log("Seeding daybook groups...");
    const daybookGroupList = [
      { groupName: "Sales", shortName: "SAL", description: "Sales transactions", isActive: true },
      { groupName: "Purchase", shortName: "PUR", description: "Purchase transactions", isActive: true },
      { groupName: "Payment", shortName: "PAY", description: "Bank and cash payment vouchers", isActive: true },
      { groupName: "Receipt", shortName: "RCT", description: "Bank and cash receipt vouchers", isActive: true },
      { groupName: "Journal", shortName: "JRN", description: "General journal vouchers", isActive: true },
      { groupName: "Contra", shortName: "CTR", description: "Inter-bank and cash transfer vouchers", isActive: true },
    ];

    for (const grp of daybookGroupList) {
      await db
        .insert(daybookGroups)
        .values(grp)
        .onConflictDoNothing({ target: daybookGroups.shortName });
    }

    const currentDaybookGroups = await db.select().from(daybookGroups);
    const daybookGroupMap = new Map(currentDaybookGroups.map((g) => [g.shortName, g.id]));

    // 13. Seeding Daybooks
    console.log("Seeding daybooks...");
    const salGroupId = daybookGroupMap.get("SAL") || 1;
    const purGroupId = daybookGroupMap.get("PUR") || 2;
    const payGroupId = daybookGroupMap.get("PAY") || 3;
    const rctGroupId = daybookGroupMap.get("RCT") || 4;
    const jrnGroupId = daybookGroupMap.get("JRN") || 5;

    const daybooksList = [
      {
        daybookName: "Wholesale Sales",
        shortName: "WSAL",
        daybookGroupId: salGroupId,
        voucherPrefix: "WS-INV",
        allowManualNumber: false,
        description: "Wholesale steel sales",
        isActive: true,
      },
      {
        daybookName: "Retail Sales",
        shortName: "RSAL",
        daybookGroupId: salGroupId,
        voucherPrefix: "RS-INV",
        allowManualNumber: false,
        description: "Retail counter sales",
        isActive: true,
      },
      {
        daybookName: "Export Sales",
        shortName: "EXSAL",
        daybookGroupId: salGroupId,
        voucherPrefix: "EXP-INV",
        allowManualNumber: false,
        description: "Overseas export sales",
        isActive: true,
      },
      {
        daybookName: "Raw Material Purchase",
        shortName: "RMPUR",
        daybookGroupId: purGroupId,
        voucherPrefix: "RM-PUR",
        allowManualNumber: false,
        description: "Raw billet & scrap purchases",
        isActive: true,
      },
      {
        daybookName: "Stores & Spares Purchase",
        shortName: "STPUR",
        daybookGroupId: purGroupId,
        voucherPrefix: "ST-PUR",
        allowManualNumber: false,
        description: "Factory consumables purchase",
        isActive: true,
      },
      {
        daybookName: "Bank Payment",
        shortName: "BNKPAY",
        daybookGroupId: payGroupId,
        voucherPrefix: "BP-VCH",
        allowManualNumber: false,
        description: "Vendor & expense bank payments",
        isActive: true,
      },
      {
        daybookName: "Cash Payment",
        shortName: "CSHPAY",
        daybookGroupId: payGroupId,
        voucherPrefix: "CP-VCH",
        allowManualNumber: true,
        description: "Petty cash expenses",
        isActive: true,
      },
      {
        daybookName: "Bank Receipt",
        shortName: "BNKRCT",
        daybookGroupId: rctGroupId,
        voucherPrefix: "BR-VCH",
        allowManualNumber: false,
        description: "Customer bank receipts",
        isActive: true,
      },
      {
        daybookName: "General Journal",
        shortName: "GENJRN",
        daybookGroupId: jrnGroupId,
        voucherPrefix: "JV",
        allowManualNumber: true,
        description: "Adjustment journal entries",
        isActive: true,
      },
    ];

    for (const dbk of daybooksList) {
      await db
        .insert(daybooks)
        .values(dbk)
        .onConflictDoNothing({ target: daybooks.shortName });
    }

    console.log("✅ Seed completed successfully!");
    console.log(`- Item Groups: ${itemGroupsList.length}`);
    console.log(`- Items: ${itemsList.length}`);
    console.log(`- Accounts: ${rawAccounts.length}`);
    console.log(`- Daybook Groups: ${daybookGroupList.length}`);
    console.log(`- Daybooks: ${daybooksList.length}`);
    console.log("Login User: admin@company.com");
    console.log("Password: password123");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    process.exit(0);
  }
}

main();

