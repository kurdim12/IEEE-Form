// ============================================================================
// 🔧 SUPABASE CONFIG
// ============================================================================
// Paste the two values from your Supabase project's Settings ▸ API page.
//
// SUPABASE_ANON_KEY is the "public" anon key — safe to ship in the
// client bundle. Real access control comes from Row-Level Security (RLS)
// policies on the registrations table (see README for the SQL).
//
// Anonymous users can ONLY INSERT new registrations. Reading, updating,
// and deleting requires a logged-in admin user. Create that user once at
// Supabase ▸ Authentication ▸ Users ▸ Add user.
// ============================================================================

export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

export function isConfigured() {
  return (
    typeof SUPABASE_URL === 'string' &&
    SUPABASE_URL.startsWith('https://') &&
    typeof SUPABASE_ANON_KEY === 'string' &&
    SUPABASE_ANON_KEY.length > 20
  );
}
