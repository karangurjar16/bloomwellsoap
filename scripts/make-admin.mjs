/**
 * Promote an existing account to admin.
 *
 *   npm run make-admin -- 9876543210
 *
 * Register the account normally first (/register), with a password of your
 * choosing, then run this with its mobile number. There is deliberately no
 * way to become admin from the website itself, and no default admin
 * password to leak.
 *
 * Reads MONGODB_URI from .env.local, like the app.
 */
import mongoose from "mongoose";

process.loadEnvFile(".env.local");

const mobile = (process.argv[2] ?? "").replace(/\D/g, "").slice(-10);
if (!/^[6-9]\d{9}$/.test(mobile)) {
  console.error("Usage: npm run make-admin -- <10-digit mobile number>");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

// The raw collection, not the app's model: that file imports through the
// "@/" path alias, which plain Node can't resolve.
const result = await mongoose.connection
  .collection("users")
  .findOneAndUpdate({ mobile }, { $set: { role: "admin" } });

if (!result) {
  console.error(
    `No account with mobile ${mobile}. Register it at /register first.`,
  );
  await mongoose.disconnect();
  process.exit(1);
}

console.log(`${result.name} (${mobile}) is now an admin.`);
console.log("Sign out and back in to get the admin session.");
await mongoose.disconnect();
