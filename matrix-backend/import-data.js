import { exec } from "child_process";
import * as dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ Error: DATABASE_URL is not set in .env");
  process.exit(1);
}

const inputFile = process.argv[2] || "database-dump.sql";

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Import file not found: ${inputFile}`);
  process.exit(1);
}

console.log(`📥 Importing database from ${inputFile}...`);

// Use psql to execute the SQL dump file
// -q: Quiet mode
const cmd = `psql "${dbUrl}" -q -f "${inputFile}"`;

exec(cmd, (err, stdout, stderr) => {
  if (err) {
    console.error("❌ Import failed:", err.message);
    if (stderr) console.error(stderr);
    process.exit(1);
  }
  console.log(`🎉 Database imported successfully from ${inputFile}`);
});
