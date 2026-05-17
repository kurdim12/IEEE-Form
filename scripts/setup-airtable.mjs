#!/usr/bin/env node
/**
 * One-time Airtable schema bootstrap.
 *
 * Creates all the fields the registration form needs in the table you point
 * AIRTABLE_TABLE_ID at. Safe to re-run — already-existing fields are skipped.
 *
 * Usage:
 *   node --env-file=.env scripts/setup-airtable.mjs
 *
 * Required env vars:
 *   AIRTABLE_TOKEN     (with scopes: schema.bases:read, schema.bases:write)
 *   AIRTABLE_BASE_ID   e.g. appXXXXXXXXXXXXXX
 *   AIRTABLE_TABLE_ID  e.g. tblXXXXXXXXXXXXXX
 */

const TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_ID = process.env.AIRTABLE_TABLE_ID;

if (!TOKEN || !BASE_ID || !TABLE_ID) {
  console.error(
    'Missing env vars. Set AIRTABLE_TOKEN, AIRTABLE_BASE_ID, and AIRTABLE_TABLE_ID in .env',
  );
  process.exit(1);
}

const META_BASE = `https://api.airtable.com/v0/meta/bases/${BASE_ID}`;

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

const FIELDS = [
  { name: 'Team Name', type: 'singleLineText', isPrimary: true },
  {
    name: 'Team Size',
    type: 'singleSelect',
    options: { choices: [{ name: '2' }, { name: '3' }] },
  },
  { name: 'Leader Name', type: 'singleLineText' },
  { name: 'Leader ID', type: 'singleLineText' },
  { name: 'Leader Major', type: 'singleLineText' },
  { name: 'Leader Phone', type: 'phoneNumber' },
  { name: 'Member 2 Name', type: 'singleLineText' },
  { name: 'Member 2 ID', type: 'singleLineText' },
  { name: 'Member 2 Major', type: 'singleLineText' },
  { name: 'Member 2 Phone', type: 'phoneNumber' },
  { name: 'Member 3 Name', type: 'singleLineText' },
  { name: 'Member 3 ID', type: 'singleLineText' },
  { name: 'Member 3 Major', type: 'singleLineText' },
  { name: 'Member 3 Phone', type: 'phoneNumber' },
  {
    name: 'Language',
    type: 'singleSelect',
    options: { choices: [{ name: 'ar' }, { name: 'en' }] },
  },
  {
    name: 'Status',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'New', color: 'blueLight2' },
        { name: 'Contacted', color: 'yellowLight2' },
        { name: 'Confirmed', color: 'greenLight2' },
        { name: 'Rejected', color: 'redLight2' },
      ],
    },
  },
  {
    name: 'Group',
    type: 'singleSelect',
    options: {
      choices: [
        { name: 'A', color: 'cyanLight2' },
        { name: 'B', color: 'tealLight2' },
        { name: 'C', color: 'greenLight2' },
        { name: 'D', color: 'yellowLight2' },
        { name: 'E', color: 'orangeLight2' },
        { name: 'F', color: 'redLight2' },
        { name: 'G', color: 'pinkLight2' },
        { name: 'H', color: 'purpleLight2' },
      ],
    },
  },
  { name: 'Submitted At', type: 'createdTime', options: {} },
];

async function listFields() {
  const res = await fetch(`${META_BASE}/tables`, { headers: HEADERS });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to list tables (${res.status}): ${body}`);
  }
  const data = await res.json();
  const table = data.tables.find((t) => t.id === TABLE_ID);
  if (!table) {
    throw new Error(`Table ${TABLE_ID} not found in base ${BASE_ID}`);
  }
  return new Map(table.fields.map((f) => [f.name, f]));
}

async function renamePrimary(existing, newName) {
  const primary = [...existing.values()][0];
  if (primary.name === newName) return;
  const res = await fetch(`${META_BASE}/tables/${TABLE_ID}/fields/${primary.id}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({ name: newName }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to rename primary field (${res.status}): ${body}`);
  }
  console.log(`  ↺ renamed primary field "${primary.name}" → "${newName}"`);
}

async function createField(field) {
  const { isPrimary, ...payload } = field;
  const res = await fetch(`${META_BASE}/tables/${TABLE_ID}/fields`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create "${field.name}" (${res.status}): ${body}`);
  }
}

async function main() {
  console.log(`Setting up Airtable schema…`);
  console.log(`  Base:  ${BASE_ID}`);
  console.log(`  Table: ${TABLE_ID}\n`);

  const existing = await listFields();
  console.log(`Found ${existing.size} existing field(s) in the table.\n`);

  const primaryField = FIELDS.find((f) => f.isPrimary);
  if (primaryField) {
    await renamePrimary(existing, primaryField.name);
    existing.set(primaryField.name, { name: primaryField.name });
  }

  for (const field of FIELDS) {
    if (field.isPrimary) continue;
    if (existing.has(field.name)) {
      console.log(`  ⊙ ${field.name.padEnd(20)} already exists, skipping`);
      continue;
    }
    try {
      await createField(field);
      console.log(`  ✓ ${field.name.padEnd(20)} created (${field.type})`);
    } catch (err) {
      console.error(`  ✗ ${field.name.padEnd(20)} FAILED: ${err.message}`);
    }
  }

  console.log(`\nDone. Open your base in Airtable to confirm.`);
}

main().catch((err) => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
