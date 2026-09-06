import pg from "pg";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KNOWN_TABLE_ORDER = [
  "users",
  "metals",
  "rate_types",
  "common_lists",
  "account_types",
  "daybook_groups",
  "items",
  "attributes",
  "item_groups",
  "account_groups",
  "daybooks",
  "accounts",
  "menus",
  "sales",
  "sales_items",
];

async function exportData() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ Error: DATABASE_URL is not set in .env");
    process.exit(1);
  }

  const outputFile = process.argv[2] || "data-export.json";
  const outputPath = path.isAbsolute(outputFile)
    ? outputFile
    : path.join(__dirname, outputFile);

  const client = new Client({ connectionString: dbUrl });

  try {
    console.log("🔌 Connecting to PostgreSQL database...");
    await client.connect();

    // 1. Fetch all public tables excluding drizzle internals
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE '%drizzle%'
      ORDER BY table_name;
    `;
    const tablesRes = await client.query(tablesQuery);
    const existingTables = tablesRes.rows.map((r) => r.table_name);

    if (existingTables.length === 0) {
      console.log(
        "⚠️ No tables found in the database. Have you run 'npm run db:push' or 'npm run seed'?",
      );
      return;
    }

    // Sort tables: known tables first in dependency order, then any custom tables
    const sortedTables = [
      ...KNOWN_TABLE_ORDER.filter((t) => existingTables.includes(t)),
      ...existingTables.filter((t) => !KNOWN_TABLE_ORDER.includes(t)),
    ];

    console.log(`📦 Found ${sortedTables.length} tables to export...\n`);

    const exportPayload = {
      metadata: {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        database: new URL(dbUrl).pathname.slice(1),
        totalTables: sortedTables.length,
        tablesSummary: {},
      },
      tables: {},
    };

    let grandTotalRows = 0;

    for (const tableName of sortedTables) {
      let query = `SELECT * FROM "${tableName}"`;
      if (tableName === "menus") {
        query += ` ORDER BY parent_menu_id NULLS FIRST, id ASC`;
      } else {
        query += ` ORDER BY id ASC`;
      }

      let rows = [];
      try {
        const res = await client.query(query);
        rows = res.rows;
      } catch {
        // Fallback without ORDER BY id if table has no id column
        const res = await client.query(`SELECT * FROM "${tableName}"`);
        rows = res.rows;
      }

      exportPayload.tables[tableName] = rows;
      exportPayload.metadata.tablesSummary[tableName] = rows.length;
      grandTotalRows += rows.length;

      console.log(
        `  ✓ ${tableName.padEnd(20)}: ${rows.length.toString().padStart(6)} rows`,
      );
    }

    // Write file with readable 2-space indentation
    fs.writeFileSync(
      outputPath,
      JSON.stringify(exportPayload, null, 2),
      "utf-8",
    );

    console.log("\n==========================================");
    console.log(`🎉 Export completed successfully!`);
    console.log(`📁 File saved to : ${outputPath}`);
    console.log(`📊 Total tables  : ${sortedTables.length}`);
    console.log(`🔢 Total records : ${grandTotalRows}`);
    console.log("==========================================\n");
  } catch (err) {
    console.error("❌ Export failed:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

exportData();
