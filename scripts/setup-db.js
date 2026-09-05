/**
 * Applies supabase-schema.sql to the database in DATABASE_URL.
 *
 * This script used to carry its own copy of the CREATE TABLE statements and its
 * own seed data, which had already drifted from supabase-schema.sql: it seeded
 * four products instead of two and set up no RLS, no policies, no indexes and no
 * realtime publication. A project bootstrapped with it therefore had row level
 * security switched off entirely, unlike one bootstrapped from the SQL file.
 *
 * Now it just executes that file, so there is exactly one schema definition.
 * The SQL is written to be safe to run repeatedly.
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');

// Minimal .env.local loader. Next injects these automatically at runtime, but a
// plain `node scripts/setup-db.js` gets no such help and there is no dotenv
// dependency in this project.
function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue; // A real environment variable always wins.
    process.env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
}

loadEnvLocal();
const connectionString = process.env.DATABASE_URL || '';

async function main() {
  if (!connectionString) {
    console.error('DATABASE_URL is not set. Add it to .env.local and try again.');
    process.exit(1);
  }

  if (!fs.existsSync(schemaPath)) {
    console.error(`Schema file not found at ${schemaPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Connecting to Supabase PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected. Applying supabase-schema.sql...');

  // One call, so the whole file runs as a single implicit transaction: a failure
  // rolls the batch back instead of leaving the schema half-applied.
  await client.query(sql);

  console.log('Supabase schema applied successfully.');
  await client.end();
}

main().catch(async (err) => {
  console.error('Schema setup failed:', err.message);
  if (err.position) {
    console.error(`  (at character position ${err.position} of supabase-schema.sql)`);
  }
  process.exit(1);
});
