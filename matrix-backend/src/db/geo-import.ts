/**
 * Geo Import Script
 * Seeds Countries (India), States, and Cities from the downloaded JSON datasets.
 *
 * Run with:
 *   npx tsx src/db/geo-import.ts
 *
 * Data sources:
 *   - src/db/geo-data/states.json   (from dr5hn/countries-states-cities-database)
 *   - src/db/geo-data/cities_raw.json
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./index.js";
import { countries, states, cities } from "./schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEO_DATA_DIR = join(__dirname, "geo-data");

interface RawState {
  id: number;
  name: string;
  country_id: number;
  country_code: string;
  country_name: string;
  iso2: string;
}

interface RawCity {
  id: number;
  name: string;
  state_id: number;
  state_code: string;
  state_name: string;
  country_id: number;
  country_code: string;
  country_name: string;
  type: string;
}

// ─── Load and filter ─────────────────────────────────────────────────────────

function loadJson<T>(filename: string): T[] {
  const filePath = join(GEO_DATA_DIR, filename);
  console.log(`📂 Loading ${filename}...`);
  const raw = readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as T[];
  console.log(`   Loaded ${data.length.toLocaleString()} records`);
  return data;
}

// ─── Bulk insert with chunking ───────────────────────────────────────────────

async function bulkInsert<T extends Record<string, any>>(
  table: any,
  rows: T[],
  chunkSize = 500,
  label = "rows",
): Promise<void> {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await db.insert(table).values(chunk).onConflictDoNothing();
    inserted += chunk.length;
    process.stdout.write(
      `\r   ✓ ${inserted.toLocaleString()} / ${rows.length.toLocaleString()} ${label} inserted`,
    );
  }
  console.log(); // newline
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌏 Starting Geo Import for India...\n");

  // ── Step 1: Insert India as Country ────────────────────────────────────────
  console.log("📌 Step 1: Inserting India (country)...");
  const [indiaRow] = await db
    .insert(countries)
    .values({
      name: "India",
      code: "IN",
      phoneCode: "+91",
      isActive: true,
    })
    .onConflictDoNothing()
    .returning({ id: countries.id, name: countries.name });

  // If India already exists, look it up
  let indiaId: number;
  if (indiaRow) {
    indiaId = indiaRow.id;
    console.log(`   ✓ India inserted with ID: ${indiaId}`);
  } else {
    const existing = await db.query.countries.findFirst({
      where: (c, { eq }) => eq(c.code, "IN"),
    });
    if (!existing) throw new Error("Failed to find or insert India");
    indiaId = existing.id;
    console.log(`   ℹ India already exists with ID: ${indiaId}`);
  }

  // ── Step 2: Load and insert States ─────────────────────────────────────────
  console.log("\n📌 Step 2: Loading and inserting States...");
  const allStates = loadJson<RawState>("states.json");
  const indiaStates = allStates.filter((s) => s.country_code === "IN");
  console.log(`   Filtered ${indiaStates.length} India states`);

  // Map: external state ID → our DB state ID
  const stateIdMap = new Map<number, number>();

  // Insert states one-by-one to capture returned IDs (needed for city mapping)
  for (const s of indiaStates) {
    const [row] = await db
      .insert(states)
      .values({
        countryId: indiaId,
        name: s.name,
        code: s.iso2,
        isActive: true,
      })
      .onConflictDoNothing()
      .returning({ id: states.id });

    if (row) {
      stateIdMap.set(s.id, row.id);
    } else {
      // Already exists — look up
      const existing = await db.query.states.findFirst({
        where: (st, { eq, and }) =>
          and(eq(st.name, s.name), eq(st.countryId, indiaId)),
      });
      if (existing) stateIdMap.set(s.id, existing.id);
    }
  }
  console.log(`   ✓ ${stateIdMap.size} states processed`);

  // ── Step 3: Load and insert Cities ─────────────────────────────────────────
  console.log("\n📌 Step 3: Loading and inserting Cities...");
  const allCities = loadJson<RawCity>("cities_raw.json");
  const indiaCities = allCities.filter((c) => c.country_code === "IN");
  console.log(`   Filtered ${indiaCities.length} India cities`);

  // Map to DB rows — only include cities whose state we know
  const cityRows = indiaCities
    .filter((c) => stateIdMap.has(c.state_id))
    .map((c) => ({
      stateId: stateIdMap.get(c.state_id)!,
      name: c.name,
      isActive: true,
    }));

  console.log(`   Preparing ${cityRows.length} city rows for bulk insert...`);
  await bulkInsert(cities, cityRows, 500, "cities");

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n🎉 Import complete!\n");
  console.log(`   Countries : 1 (India)`);
  console.log(`   States    : ${stateIdMap.size}`);
  console.log(`   Cities    : ${cityRows.length}`);
  console.log(
    `\nℹ️  Areas and Pincodes can be added manually via the API or by extending this script.`,
  );
  console.log(
    `   Tip: Run 'npm run db:push' first if you haven't applied the schema yet.\n`,
  );

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Import failed:", err);
  process.exit(1);
});
