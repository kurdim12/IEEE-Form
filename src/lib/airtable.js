import { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID } from './config.js';

const RECORDS_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;
const META_URL = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}`;
const SCHEMA_CACHE_KEY = 'ieee-form-schema-ready-v1';

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

function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${AIRTABLE_TOKEN}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function listExistingFields() {
  const res = await fetch(`${META_URL}/tables`, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cannot read base schema (${res.status}). ${body}`);
  }
  const data = await res.json();
  const table = data.tables.find((t) => t.id === AIRTABLE_TABLE_ID);
  if (!table) throw new Error(`Table ${AIRTABLE_TABLE_ID} not found in base ${AIRTABLE_BASE_ID}`);
  return { table, byName: new Map(table.fields.map((f) => [f.name, f])) };
}

async function renamePrimary(field, newName) {
  if (field.name === newName) return;
  const res = await fetch(`${META_URL}/tables/${AIRTABLE_TABLE_ID}/fields/${field.id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ name: newName }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to rename primary field: ${body}`);
  }
}

async function createField(field) {
  const { isPrimary, ...payload } = field;
  const res = await fetch(`${META_URL}/tables/${AIRTABLE_TABLE_ID}/fields`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create field "${field.name}": ${body}`);
  }
}

export async function ensureSchema() {
  if (typeof window !== 'undefined' && window.localStorage?.getItem(SCHEMA_CACHE_KEY) === 'ready') {
    return { cached: true };
  }
  const { table, byName } = await listExistingFields();
  const primary = FIELDS.find((f) => f.isPrimary);
  if (primary && table.fields[0]) {
    await renamePrimary(table.fields[0], primary.name);
    byName.set(primary.name, { name: primary.name });
  }
  for (const field of FIELDS) {
    if (field.isPrimary) continue;
    if (byName.has(field.name)) continue;
    await createField(field);
  }
  if (typeof window !== 'undefined') {
    window.localStorage?.setItem(SCHEMA_CACHE_KEY, 'ready');
  }
  return { cached: false };
}

export async function isDuplicate(leaderId) {
  const filter = encodeURIComponent(`{Leader ID}="${leaderId}"`);
  const res = await fetch(`${RECORDS_URL}?filterByFormula=${filter}&maxRecords=1`, {
    headers: authHeaders(),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return Array.isArray(data.records) && data.records.length > 0;
}

function buildFields(payload) {
  const fields = {
    'Team Name': payload.teamName,
    'Team Size': String(payload.teamSize),
    'Leader Name': payload.leader.fullName,
    'Leader ID': payload.leader.universityId,
    'Leader Major': payload.leader.major,
    'Leader Phone': payload.leader.phone,
    'Member 2 Name': payload.member2.fullName,
    'Member 2 ID': payload.member2.universityId,
    'Member 2 Major': payload.member2.major,
    'Member 2 Phone': payload.member2.phone,
    Language: payload.meta?.language || '',
    Status: 'New',
  };
  if (payload.member3 && payload.teamSize === '3') {
    fields['Member 3 Name'] = payload.member3.fullName;
    fields['Member 3 ID'] = payload.member3.universityId;
    fields['Member 3 Major'] = payload.member3.major;
    fields['Member 3 Phone'] = payload.member3.phone;
  }
  return fields;
}

export async function createRecord(payload) {
  const res = await fetch(RECORDS_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ fields: buildFields(payload) }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable error ${res.status}: ${body}`);
  }
  return res.json();
}
