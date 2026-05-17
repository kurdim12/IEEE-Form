const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

export class SubmissionError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function isApiConfigured() {
  return Boolean(APPS_SCRIPT_URL);
}

export async function submitRegistration(payload) {
  if (!APPS_SCRIPT_URL) {
    throw new SubmissionError('configMissing', 'Apps Script URL missing');
  }

  let response;
  try {
    response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new SubmissionError('network', err.message);
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new SubmissionError('network', 'Invalid response');
  }

  if (!data.success) {
    if (data.error === 'duplicate') {
      throw new SubmissionError('duplicate', 'Duplicate registration');
    }
    throw new SubmissionError('generic', data.error || 'Unknown error');
  }

  return data;
}
