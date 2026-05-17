/**
 * Shared Airtable schema bootstrap.
 * Used by both scripts/setup-airtable.mjs (local CLI) and api/setup.js
 * (Vercel function the user can hit once after deploying).
 */

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

export async function runSetup({ token, baseId, tableId, log = () => {} } = {}) {
  if (!token || !baseId || !tableId) {
    throw new Error('Missing token, baseId, or tableId');
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const metaBase = `https://api.airtable.com/v0/meta/bases/${baseId}`;

  const results = [];

  // Discover existing fields
  const tablesRes = await fetch(`${metaBase}/tables`, { headers });
  if (!tablesRes.ok) {
    const body = await tablesRes.text();
    throw new Error(`Failed to list tables (${tablesRes.status}): ${body}`);
  }
  const tablesJson = await tablesRes.json();
  const table = tablesJson.tables.find((t) => t.id === tableId);
  if (!table) {
    throw new Error(`Table ${tableId} not found in base ${baseId}`);
  }
  const existingByName = new Map(table.fields.map((f) => [f.name, f]));
  log(`Found ${existingByName.size} existing field(s) in the table.`);

  // Rename primary field if needed
  const primary = FIELDS.find((f) => f.isPrimary);
  if (primary) {
    const primaryRow = table.fields[0];
    if (primaryRow && primaryRow.name !== primary.name) {
      const renameRes = await fetch(`${metaBase}/tables/${tableId}/fields/${primaryRow.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ name: primary.name }),
      });
      if (!renameRes.ok) {
        const body = await renameRes.text();
        const msg = `Failed to rename primary field (${renameRes.status}): ${body}`;
        results.push({ field: primary.name, status: 'error', message: msg });
        log(`✗ ${msg}`);
      } else {
        results.push({ field: primary.name, status: 'renamed', from: primaryRow.name });
        log(`↺ renamed primary "${primaryRow.name}" → "${primary.name}"`);
      }
    } else if (primaryRow) {
      results.push({ field: primary.name, status: 'skipped' });
      log(`⊙ ${primary.name} (primary) already named correctly, skipping`);
    }
    existingByName.set(primary.name, { name: primary.name });
  }

  // Create non-primary fields
  for (const field of FIELDS) {
    if (field.isPrimary) continue;
    if (existingByName.has(field.name)) {
      results.push({ field: field.name, status: 'skipped' });
      log(`⊙ ${field.name} already exists, skipping`);
      continue;
    }
    const { isPrimary, ...payload } = field;
    const res = await fetch(`${metaBase}/tables/${tableId}/fields`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.text();
      const msg = `Failed to create "${field.name}" (${res.status}): ${body}`;
      results.push({ field: field.name, status: 'error', message: msg });
      log(`✗ ${msg}`);
    } else {
      results.push({ field: field.name, status: 'created', type: field.type });
      log(`✓ ${field.name} created (${field.type})`);
    }
  }

  return results;
}
