import { db } from "./index";
import { users } from "./schema";
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
