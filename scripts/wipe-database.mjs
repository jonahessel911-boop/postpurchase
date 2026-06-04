/**
 * Deletes all rows from campaigns, ads, clicks, conversions, invoices, advertisers.
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 *
 * Usage: node --env-file=.env.local scripts/wipe-database.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const tables = [
  "conversions",
  "clicks",
  "ads",
  "invoices",
  "campaigns",
  "advertisers",
];

for (const table of tables) {
  const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) {
    console.error(`Failed to clear ${table}:`, error.message);
    process.exit(1);
  }
  console.log(`Cleared ${table}`);
}

console.log("Done. Refresh /campaigns — list should be empty.");
