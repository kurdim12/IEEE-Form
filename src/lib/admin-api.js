import { AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID } from './config.js';

const RECORDS_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`;

function headers() {
  return {
    Authorization: `Bearer ${AIRTABLE_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchAllRecords() {
  const records = [];
  let offset;
  do {
    const url = new URL(RECORDS_URL);
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('sort[0][field]', 'Submitted At');
    url.searchParams.set('sort[0][direction]', 'desc');
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url.toString(), { headers: headers() });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable ${res.status}: ${body}`);
    }
    const data = await res.json();
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return records;
}

export async function updateRecord(id, fields) {
  const res = await fetch(`${RECORDS_URL}/${id}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${res.status}: ${body}`);
  }
  return res.json();
}

export async function deleteRecord(id) {
  const res = await fetch(`${RECORDS_URL}/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${res.status}: ${body}`);
  }
  return res.json();
}
