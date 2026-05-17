/**
 * Airtable submission handler — shared by the Vercel serverless function
 * (api/submit.js) and the Vite dev middleware (vite.config.js).
 *
 * Reads credentials from process.env. All env vars are SERVER-SIDE ONLY
 * (no VITE_ prefix) so the token is never bundled into the client.
 */

const PHONE_RE = /^(\+962|0)?7[789]\d{7}$/;
const ID_RE = /^\d{9}$/;

function env(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function airtableUrl() {
  return `https://api.airtable.com/v0/${env('AIRTABLE_BASE_ID')}/${env('AIRTABLE_TABLE_ID')}`;
}

function authHeaders() {
  return {
    Authorization: `Bearer ${env('AIRTABLE_TOKEN')}`,
    'Content-Type': 'application/json',
  };
}

function validateMember(m) {
  if (!m || typeof m !== 'object') return false;
  const fullName = String(m.fullName || '').trim();
  const universityId = String(m.universityId || '').trim();
  const major = String(m.major || '').trim();
  const phone = String(m.phone || '').trim();
  if (fullName.length < 3) return false;
  if (!ID_RE.test(universityId)) return false;
  if (major.length < 1) return false;
  if (!PHONE_RE.test(phone)) return false;
  return true;
}

function validate(data) {
  if (!data || typeof data !== 'object') return 'invalid_payload';
  const teamName = String(data.teamName || '').trim();
  if (teamName.length < 2) return 'invalid_team_name';
  const teamSize = String(data.teamSize || '');
  if (teamSize !== '2' && teamSize !== '3') return 'invalid_team_size';
  if (!validateMember(data.leader)) return 'invalid_leader';
  if (!validateMember(data.member2)) return 'invalid_member2';
  if (teamSize === '3' && !validateMember(data.member3)) return 'invalid_member3';
  return null;
}

async function isDuplicate(leaderId) {
  const filter = encodeURIComponent(`{Leader ID}="${leaderId}"`);
  const url = `${airtableUrl()}?filterByFormula=${filter}&maxRecords=1`;
  const res = await fetch(url, { headers: authHeaders() });
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

async function createRecord(payload) {
  const res = await fetch(airtableUrl(), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ fields: buildFields(payload) }),
  });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`Airtable API error ${res.status}`);
    err.detail = body;
    throw err;
  }
  return res.json();
}

export async function handleSubmit(payload) {
  const validationError = validate(payload);
  if (validationError) return { success: false, error: validationError };

  if (await isDuplicate(payload.leader.universityId)) {
    return { success: false, error: 'duplicate' };
  }

  try {
    await createRecord(payload);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: 'airtable_error',
      detail: err.detail || err.message,
    };
  }
}
