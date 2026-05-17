#!/usr/bin/env node
/**
 * One-time Airtable schema bootstrap (local CLI version).
 *
 * Usage:
 *   node --env-file=.env scripts/setup-airtable.mjs
 *
 * For the no-install version, deploy the project to Vercel first then
 * visit https://<your-app>.vercel.app/api/setup
 */
import { runSetup } from '../lib/airtable-setup.js';

const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_ID = process.env.AIRTABLE_TABLE_ID;

if (!TOKEN || !BASE_ID || !TABLE_ID) {
  console.error(
    'Missing env vars. Set AIRTABLE_TOKEN, AIRTABLE_BASE_ID, and AIRTABLE_TABLE_ID in .env',
  );
  process.exit(1);
}

console.log('Setting up Airtable schema…');
console.log(`  Base:  ${BASE_ID}`);
console.log(`  Table: ${TABLE_ID}\n`);

try {
  const results = await runSetup({
    token: TOKEN,
    baseId: BASE_ID,
    tableId: TABLE_ID,
    log: (line) => console.log('  ' + line),
  });

  const errors = results.filter((r) => r.status === 'error');
  if (errors.length) {
    console.error(`\nFinished with ${errors.length} error(s).`);
    process.exit(1);
  }
  console.log('\nDone. Open your base in Airtable to confirm.');
} catch (err) {
  console.error('\nFatal:', err.message);
  process.exit(1);
}
