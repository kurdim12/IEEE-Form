import { runSetup } from '../lib/airtable-setup.js';

/**
 * One-time setup endpoint. Visit
 *   https://<your-app>.vercel.app/api/setup?confirm=yes
 * to create all the Airtable fields for the registration form.
 *
 * Idempotent — already-existing fields are skipped, so re-running is safe.
 * Reads AIRTABLE_TOKEN / AIRTABLE_BASE_ID / AIRTABLE_TABLE_ID from
 * Vercel project env vars; the token never leaves the server.
 */
export default async function handler(req, res) {
  const confirm = req.query?.confirm === 'yes';

  if (!confirm) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>IEEE UoP — Airtable Setup</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 24px;color:#0f172a;line-height:1.55}
    h1{color:#00629B}
    code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:.9em}
    .btn{display:inline-block;background:#00629B;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:600;margin-top:16px}
    .btn:hover{background:#004F7C}
    .warn{background:#FEF3C7;border:1px solid #FCD34D;padding:12px 16px;border-radius:8px;font-size:.9em;margin-top:24px}
  </style>
</head>
<body>
  <h1>Airtable schema setup</h1>
  <p>This will create the 18 fields the registration form needs in your Airtable table — Team Name, Team Size, Leader/Member fields, plus the <code>Status</code> and <code>Group</code> single-selects with colored options for organizing teams.</p>
  <p>Safe to click. Already-existing fields are skipped, so you can re-run if you need to.</p>
  <a class="btn" href="/api/setup?confirm=yes">Run setup now &rarr;</a>
  <div class="warn">
    <strong>Make sure first:</strong> your Airtable token in Vercel env vars has the <code>schema.bases:read</code> and <code>schema.bases:write</code> scopes. You can narrow it back to just data scopes after setup.
  </div>
</body>
</html>`);
  }

  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableId = process.env.AIRTABLE_TABLE_ID;

  if (!token || !baseId || !tableId) {
    return res.status(500).json({
      success: false,
      error: 'missing_env',
      detail: 'AIRTABLE_TOKEN, AIRTABLE_BASE_ID, and AIRTABLE_TABLE_ID must be set in Vercel env vars.',
    });
  }

  const logs = [];
  try {
    const results = await runSetup({
      token,
      baseId,
      tableId,
      log: (line) => logs.push(line),
    });

    const created = results.filter((r) => r.status === 'created').length;
    const renamed = results.filter((r) => r.status === 'renamed').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;
    const errors = results.filter((r) => r.status === 'error');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(errors.length ? 500 : 200).end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Setup complete</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 24px;color:#0f172a;line-height:1.55}
    h1{color:${errors.length ? '#B91C1C' : '#15803D'}}
    pre{background:#0f172a;color:#e2e8f0;padding:16px;border-radius:12px;overflow:auto;font-size:.85em;line-height:1.45}
    .stats{display:flex;gap:16px;flex-wrap:wrap;margin:16px 0}
    .stat{background:#f1f5f9;padding:8px 14px;border-radius:8px;font-size:.9em;font-weight:600}
    .ok{background:#dcfce7;color:#166534}
    .err{background:#fee2e2;color:#991b1b}
    .btn{display:inline-block;background:#00629B;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;margin-top:16px}
  </style>
</head>
<body>
  <h1>${errors.length ? '⚠️ Setup finished with errors' : '✅ Setup complete'}</h1>
  <div class="stats">
    <span class="stat ok">${created} created</span>
    ${renamed ? `<span class="stat ok">${renamed} renamed</span>` : ''}
    <span class="stat">${skipped} skipped (already existed)</span>
    ${errors.length ? `<span class="stat err">${errors.length} errors</span>` : ''}
  </div>
  <p>${errors.length
    ? 'Some fields failed. Check the log below — usually means the token is missing schema scopes.'
    : 'Open your Airtable base — every field is ready. You can now submit a test registration from your live site.'}</p>
  <pre>${logs.map(escape).join('\n')}</pre>
  <a class="btn" href="/">Back to registration form &rarr;</a>
</body>
</html>`);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'setup_failed',
      detail: err.message,
      logs,
    });
  }
}

function escape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
