import { exec } from "child_process";
import * as dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ Error: DATABASE_URL is not set in .env");
  process.exit(1);
}

const outputFile = process.argv[2] || "database-dump.sql";

console.log(`📦 Exporting database to ${outputFile}...`);

const cmd = `pg_dump "${dbUrl}" -c -O -f "${outputFile}"`;

exec(cmd, (err, stdout, stderr) => {
  if (err) {
    console.error("❌ Export failed:", err.message);
    if (stderr) console.error(stderr);
    process.exit(1);
  }
  console.log(`🎉 Database exported successfully to ${outputFile}`);
});
