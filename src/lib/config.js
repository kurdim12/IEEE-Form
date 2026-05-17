// ============================================================================
// 🚨 AIRTABLE CREDENTIALS
// ============================================================================
// These values are bundled into the public JavaScript file. Anyone who opens
// your deployed site and inspects the network/console can read them.
//
// THIS IS OK FOR A SHORT EVENT (2-3 days) AS LONG AS:
//   1. The token is scoped to ONLY this one Airtable base
//   2. You rotate (delete) the token at airtable.com/create/tokens AFTER the
//      event ends
//   3. You delete the Airtable base afterwards if it contained sensitive data
//
// For ongoing / production use, move the token to a server-side env var on
// Vercel and proxy through a serverless function. See git history for that
// version of the project.
// ============================================================================

export const AIRTABLE_TOKEN = 'patEftXM9jUdmKQXx.777f96bb870a352d2a6f37819b78decdff4f771442dcf72706ea0e87537f2a27';
export const AIRTABLE_BASE_ID = 'appJZtjKuHRmJdwqt';
export const AIRTABLE_TABLE_ID = 'tblEN5ajH7Qz0nLG7';

// Password for /admin page. Change this before sharing the link with anyone.
export const ADMIN_PASSWORD = 'ieee-uop-2026';

export function isConfigured() {
  return (
    typeof AIRTABLE_TOKEN === 'string' &&
    AIRTABLE_TOKEN.startsWith('pat') &&
    AIRTABLE_BASE_ID.startsWith('app') &&
    AIRTABLE_TABLE_ID.startsWith('tbl')
  );
}
