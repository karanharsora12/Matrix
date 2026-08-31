import pg from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const { Client } = pg;

async function createDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not set in .env");
    return;
  }

  const url = new URL(dbUrl);
  const dbName = url.pathname.slice(1);
  url.pathname = "/postgres";

  const client = new Client({
    connectionString: url.toString(),
  });

  try {
    await client.connect();

    // Check if database exists
    const res = await client.query(
      `SELECT datname FROM pg_catalog.pg_database WHERE datname = '${dbName}'`,
    );

    if (res.rowCount === 0) {
      console.log(`Creating database ${dbName}...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log("Database created successfully!");
    } else {
      console.log(`Database ${dbName} already exists.`);
    }
  } catch (err) {
    console.error("Error creating database:", err);
  } finally {
    await client.end();
  }
}

createDatabase();
