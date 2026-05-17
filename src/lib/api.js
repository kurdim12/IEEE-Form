import { isConfigured } from './config.js';
import { ensureSchema, isDuplicate, createRecord } from './airtable.js';

export class SubmissionError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function isApiConfigured() {
  return isConfigured();
}

export async function submitRegistration(payload) {
  if (!isConfigured()) {
    throw new SubmissionError('configMissing', 'Airtable credentials missing');
  }

  try {
    await ensureSchema();
  } catch (err) {
    throw new SubmissionError('setup', err.message);
  }

  let duplicate = false;
  try {
    duplicate = await isDuplicate(payload.leader.universityId);
  } catch {
    // If duplicate check fails (e.g. network blip) we still let the submission
    // through — Airtable itself will store the row and we can dedupe later.
  }
  if (duplicate) {
    throw new SubmissionError('duplicate', 'Duplicate registration');
  }

  try {
    await createRecord(payload);
    return { success: true };
  } catch (err) {
    throw new SubmissionError('generic', err.message);
  }
}
