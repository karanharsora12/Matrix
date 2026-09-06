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

async function ensureDatabaseExists(dbUrl) {
  const url = new URL(dbUrl);
  const dbName = url.pathname.slice(1);
  url.pathname = "/postgres";

  const client = new Client({ connectionString: url.toString() });
  try {
    await client.connect();
    const res = await client.query(
      `SELECT datname FROM pg_catalog.pg_database WHERE datname = $1`,
      [dbName],
    );

    if (res.rowCount === 0) {
      console.log(`Database '${dbName}' does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✓ Database '${dbName}' created successfully!`);
    }
  } catch (err) {
    console.warn(`⚠️ Note on database check: ${err.message}`);
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

async function ensureTablesExist(client) {
  const tablesRes = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE '%drizzle%';
  `);
  let dbTables = tablesRes.rows.map((r) => r.table_name);

  if (dbTables.length === 0) {
    console.log(
      "⚠️ No tables found in database. Setting up database schema...",
    );
    const drizzleDir = path.join(__dirname, "drizzle");
    if (fs.existsSync(drizzleDir)) {
      const sqlFiles = fs
        .readdirSync(drizzleDir)
        .filter((f) => f.endsWith(".sql"))
        .sort();

      for (const sqlFile of sqlFiles) {
        console.log(`  Applying migration ${sqlFile}...`);
        const sqlContent = fs.readFileSync(
          path.join(drizzleDir, sqlFile),
          "utf-8",
        );
        const statements = sqlContent.split("--> statement-breakpoint");
        for (const rawStmt of statements) {
          const stmt = rawStmt.trim();
          if (stmt) {
            await client.query(stmt);
          }
        }
      }

      const updatedTablesRes = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          AND table_name NOT LIKE '%drizzle%';
      `);
      dbTables = updatedTablesRes.rows.map((r) => r.table_name);
      console.log(
        `✓ Created ${dbTables.length} tables from schema migrations!`,
      );
    } else {
      console.error(
        "\n❌ No tables exist and no 'drizzle/' migration directory was found!",
      );
      console.log(
        "👉 Please run 'npm run db:push' or 'npm run db:generate' first.",
      );
      process.exit(1);
    }
  }

  return dbTables;
}

async function importData() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ Error: DATABASE_URL is not set in .env");
    process.exit(1);
  }

  const inputFile = process.argv[2] || "data-export.json";
  const inputPath = path.isAbsolute(inputFile)
    ? inputFile
    : path.join(__dirname, inputFile);

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Import file not found: ${inputPath}`);
    console.log(
      "👉 Please make sure the export file exists, or pass the path: node import-data.js [filepath]",
    );
    process.exit(1);
  }

  let importDataPayload;
  try {
    const raw = fs.readFileSync(inputPath, "utf-8");
    importDataPayload = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ Failed to parse JSON from ${inputPath}:`, err.message);
    process.exit(1);
  }

  const tablesData = importDataPayload.tables || {};
  const tableNames = Object.keys(tablesData);

  if (tableNames.length === 0) {
    console.log("⚠️ No table data found in the export file.");
    return;
  }

  // 1. Ensure database exists
  await ensureDatabaseExists(dbUrl);

  const client = new Client({ connectionString: dbUrl });

  try {
    console.log("🔌 Connecting to PostgreSQL database...");
    await client.connect();

    // 2. Check if tables exist; automatically apply schema if database is fresh
    const dbTables = await ensureTablesExist(client);

    // Sort tables according to dependency order
    const orderedTables = [
      ...KNOWN_TABLE_ORDER.filter((t) => tableNames.includes(t)),
      ...tableNames.filter((t) => !KNOWN_TABLE_ORDER.includes(t)),
    ];

    console.log(
      `\n📥 Starting import of ${orderedTables.length} tables from ${path.basename(inputPath)}...`,
    );

    // Begin Transaction
    await client.query("BEGIN;");

    // Attempt to disable foreign key checks during import session
    let usedReplicaRole = false;
    try {
      await client.query("SET session_replication_role = 'replica';");
      usedReplicaRole = true;
    } catch {
      console.log(
        "ℹ️ session_replication_role not available, using dependency-ordered operations.",
      );
    }

    // 3. Truncate existing tables in reverse dependency order
    const reverseOrder = [...orderedTables].reverse();
    for (const tableName of reverseOrder) {
      if (dbTables.includes(tableName)) {
        try {
          await client.query(
            `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`,
          );
        } catch {
          await client.query(`DELETE FROM "${tableName}";`);
        }
      }
    }
    console.log("🧹 Cleaned existing records from target tables.");

    // 4. Insert data table by table
    let totalImportedRows = 0;

    for (const tableName of orderedTables) {
      const rows = tablesData[tableName] || [];
      if (!dbTables.includes(tableName)) {
        console.log(
          `  ⚠️ Skipping '${tableName}' (table does not exist in target database)`,
        );
        continue;
      }

      if (rows.length === 0) {
        console.log(`  ✓ ${tableName.padEnd(20)}:      0 rows (empty)`);
        continue;
      }

      // Collect all column keys present across rows in this table
      const columnsSet = new Set();
      for (const row of rows) {
        for (const k of Object.keys(row)) {
          columnsSet.add(k);
        }
      }
      const columns = Array.from(columnsSet);
      const quotedCols = columns.map((c) => `"${c}"`).join(", ");

      // Batch insert rows
      const batchSize = Math.max(
        1,
        Math.min(100, Math.floor(5000 / columns.length)),
      );
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const values = [];
        const valuePlaceholders = [];

        batch.forEach((row, rowIndex) => {
          const rowPlaceholders = [];
          columns.forEach((col, colIndex) => {
            const paramIdx = rowIndex * columns.length + colIndex + 1;
            rowPlaceholders.push(`$${paramIdx}`);
            let val = row[col];
            if (val === undefined) val = null;
            values.push(val);
          });
          valuePlaceholders.push(`(${rowPlaceholders.join(", ")})`);
        });

        const insertQuery = `
          INSERT INTO "${tableName}" (${quotedCols})
          VALUES ${valuePlaceholders.join(", ")};
        `;
        await client.query(insertQuery, values);
      }

      // 5. Reset auto-increment sequence for primary key 'id'
      try {
        const seqRes = await client.query(
          `SELECT pg_get_serial_sequence($1, 'id') AS seq;`,
          [tableName],
        );
        const seqName = seqRes.rows[0]?.seq;
        if (seqName) {
          await client.query(
            `
            SELECT setval(
              $1,
              COALESCE((SELECT MAX(id) FROM "${tableName}"), 0) + 1,
              false
            );
          `,
            [seqName],
          );
        }
      } catch {
        // Table might not have 'id' sequence
      }

      totalImportedRows += rows.length;
      console.log(
        `  ✓ ${tableName.padEnd(20)}: ${rows.length.toString().padStart(6)} rows`,
      );
    }

    // Restore replication role
    if (usedReplicaRole) {
      await client.query("SET session_replication_role = 'origin';");
    }

    // Commit Transaction
    await client.query("COMMIT;");

    console.log("\n==========================================");
    console.log(`🎉 Import completed successfully!`);
    console.log(`📊 Tables imported : ${orderedTables.length}`);
    console.log(`🔢 Records imported: ${totalImportedRows}`);
    console.log(`🔄 Auto-increment sequences reset.`);
    console.log("==========================================\n");
  } catch (err) {
    try {
      await client.query("ROLLBACK;");
    } catch {}
    console.error("\n❌ Import failed! Rolled back transaction.");
    console.error("Error details:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

importData();
