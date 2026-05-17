const ENDPOINT = '/api/submit';

export class SubmissionError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function isApiConfigured() {
  // The endpoint is same-origin; configuration lives server-side in env vars.
  // The frontend has no way to verify those, so we assume yes.
  return true;
}

export async function submitRegistration(payload) {
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new SubmissionError('network', err.message);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new SubmissionError('network', 'Invalid response');
  }

  if (!response.ok || !data.success) {
    if (data.error === 'duplicate') throw new SubmissionError('duplicate', 'Duplicate registration');
    throw new SubmissionError('generic', data.error || `HTTP ${response.status}`);
  }

  return data;
}
