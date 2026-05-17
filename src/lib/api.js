import { isConfigured } from './config.js';
import { getSupabase, TABLE } from './supabase.js';

export class SubmissionError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function isApiConfigured() {
  return isConfigured();
}

function rowFromPayload(payload) {
  return {
    team_name: payload.teamName.trim(),
    team_size: String(payload.teamSize),
    leader_name: payload.leader.fullName.trim(),
    leader_id: payload.leader.universityId.trim(),
    leader_major: payload.leader.major,
    leader_phone: payload.leader.phone.trim(),
    member2_name: payload.member2.fullName.trim(),
    member2_id: payload.member2.universityId.trim(),
    member2_major: payload.member2.major,
    member2_phone: payload.member2.phone.trim(),
    member3_name: payload.member3?.fullName?.trim() || null,
    member3_id: payload.member3?.universityId?.trim() || null,
    member3_major: payload.member3?.major || null,
    member3_phone: payload.member3?.phone?.trim() || null,
    language: payload.meta?.language || null,
    status: 'New',
  };
}

export async function submitRegistration(payload) {
  if (!isConfigured()) {
    throw new SubmissionError('configMissing', 'Supabase credentials missing');
  }

  const supabase = getSupabase();
  const { error } = await supabase.from(TABLE).insert(rowFromPayload(payload));

  if (error) {
    if (error.code === '23505') {
      throw new SubmissionError('duplicate', 'Duplicate registration');
    }
    if (error.message?.toLowerCase().includes('failed to fetch')) {
      throw new SubmissionError('network', error.message);
    }
    throw new SubmissionError('generic', error.message);
  }

  return { success: true };
}
