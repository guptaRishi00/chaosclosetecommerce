// Create or update the admin account. Credentials come from the environment only —
// never commit them. Re-running resets the password and (re)grants the admin role.
//
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='…' ADMIN_NAME='Your Name' bun run seed:admin
//
// Plain .mjs run by Node (not Bun: bson crashes on Bun 1.2), so it can't import lib/password.ts;
// the hash below must stay byte-compatible with it: "saltHex:hashHex", scrypt, 16-byte salt, 64-byte key.
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import mongoose from "mongoose";

const scryptAsync = promisify(scrypt);

const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = "Admin" } = process.env;
if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Set MONGODB_URI (via .env.local), ADMIN_EMAIL and ADMIN_PASSWORD.");
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = await scryptAsync(ADMIN_PASSWORD, salt, 64);
const passwordHash = `${salt.toString("hex")}:${hash.toString("hex")}`;
const email = ADMIN_EMAIL.trim().toLowerCase();

await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
const now = new Date();
const res = await mongoose.connection.db.collection("users").updateOne(
  { email },
  {
    $set: { role: "admin", passwordHash, updatedAt: now },
    $setOnInsert: { email, name: ADMIN_NAME, country: "India", createdAt: now },
  },
  { upsert: true },
);
console.log(res.upsertedCount ? `Created admin ${email}` : `Updated admin ${email} (role=admin, password reset)`);
await mongoose.disconnect();
