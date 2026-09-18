/**
 * Pincode Import Script
 * Downloads post office / pincode data from the India Pincode API
 * (https://aniket-thapa.github.io/india-pincode-api) and seeds it into
 * the `areas` and `pincodes` tables.
 *
 * This script uses districts as "areas" and post offices as "pincodes".
 *
 * Run AFTER geo-import.ts (which seeds countries, states, cities).
 *
 *   npx tsx src/db/pincode-import.ts
 */

import { eq, and } from "drizzle-orm";
import { db } from "./index.js";
import { states, cities, areas, pincodes } from "./schema.js";

const BASE_URL = "https://aniket-thapa.github.io/india-pincode-api";

// ─── Types from the API ───────────────────────────────────────────────────────

interface ApiState {
  name: string;
  slug: string;
  districtCount: number;
  officeCount: number;
}

interface ApiDistrict {
  name: string;
  slug: string;
  officeCount: number;
}

interface ApiStateDetail {
  name: string;
  slug: string;
  districts: ApiDistrict[];
}

interface ApiPostOffice {
  officeName: string;
  pincode: string;
  officeType: string;
  deliveryStatus: string;
}

interface ApiDistrictDetail {
  district: string;
  districtSlug: string;
  state: string;
  stateSlug: string;
  offices: ApiPostOffice[];
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, retries = 3): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return (await res.json()) as T;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error("unreachable");
}

// ─── Bulk insert helper ───────────────────────────────────────────────────────

async function bulkInsert<T extends Record<string, any>>(
  table: any,
  rows: T[],
  chunkSize = 500,
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    await db.insert(table).values(rows.slice(i, i + chunkSize)).onConflictDoNothing();
  }
}

// ─── Normalize state name for matching ───────────────────────────────────────

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("📮 Starting Pincode Import...\n");

  // ── Fetch India's country/state rows from DB ──────────────────────────────

  const dbStates = await db
    .select({ id: states.id, name: states.name })
    .from(states);

  const dbCities = await db
    .select({ id: cities.id, name: cities.name, stateId: cities.stateId })
    .from(cities);

  // Build lookup maps
  const stateByNorm = new Map<string, number>(); // normalized name → DB id
  for (const s of dbStates) stateByNorm.set(normalize(s.name), s.id);

  // ── Fetch all states from API ─────────────────────────────────────────────

  console.log("📌 Step 1: Fetching state list from Pincode API...");
  const apiStates = await fetchJson<ApiState[]>(`${BASE_URL}/states.json`);
  console.log(`   Got ${apiStates.length} states\n`);

  let totalAreas = 0;
  let totalPincodes = 0;

  for (const apiState of apiStates) {
    const dbStateId = stateByNorm.get(normalize(apiState.name));
    if (!dbStateId) {
      console.warn(`   ⚠ State not found in DB: "${apiState.name}" — skipping`);
      continue;
    }

    // Fetch district list for this state
    const stateDetail = await fetchJson<ApiStateDetail>(
      `${BASE_URL}/states/${apiState.slug}.json`,
    );

    process.stdout.write(
      `\r   Processing: ${apiState.name.padEnd(35)} districts: ${stateDetail.districts.length}`,
    );

    for (const district of stateDetail.districts) {
      // Find best matching city in this state for this district
      const districtNorm = normalize(district.name);
      const matchingCity = dbCities.find(
        (c) => c.stateId === dbStateId && normalize(c.name) === districtNorm,
      );

      // Insert area (district) — link to city if found, else first city of state
      const fallbackCity = dbCities.find((c) => c.stateId === dbStateId);
      const linkedCityId = matchingCity?.id ?? fallbackCity?.id;

      if (!linkedCityId) continue;

      // Upsert area
      const [areaRow] = await db
        .insert(areas)
        .values({
          cityId: linkedCityId,
          name: district.name
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" "),
          isActive: true,
        })
        .onConflictDoNothing()
        .returning({ id: areas.id });

      // Look up already-existing area if conflict
      let areaId: number | undefined = areaRow?.id;
      if (!areaId) {
        const existing = await db
          .select({ id: areas.id })
          .from(areas)
          .where(
            and(
              eq(areas.cityId, linkedCityId),
              eq(
                areas.name,
                district.name
                  .split(" ")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                  .join(" "),
              ),
            ),
          )
          .limit(1);
        areaId = existing[0]?.id;
      }

      if (!areaId) continue;
      totalAreas++;

      // Fetch post offices for this district
      try {
        const districtDetail = await fetchJson<ApiDistrictDetail>(
          `${BASE_URL}/districts/${apiState.slug}/${district.slug}.json`,
        );

        const pincodeRows = districtDetail.offices
          .filter((o) => o.pincode && o.pincode.length === 6)
          .map((o) => ({
            cityId: linkedCityId,
            areaId,
            pincode: o.pincode,
            officeName: o.officeName
              .split(" ")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(" "),
            isActive: true,
          }));

        if (pincodeRows.length > 0) {
          await bulkInsert(pincodes, pincodeRows, 500);
          totalPincodes += pincodeRows.length;
        }
      } catch {
        // district fetch failed — skip post offices for this district
      }
    }

    console.log(); // newline after progress
  }

  console.log("\n🎉 Pincode Import Complete!\n");
  console.log(`   Areas    : ${totalAreas}`);
  console.log(`   Pincodes : ${totalPincodes}\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error("\n❌ Import failed:", err);
  process.exit(1);
});
