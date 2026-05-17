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

export const SUPABASE_URL = 'https://rhfrmlesiuiukyknpowo.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZnJtbGVzaXVpdWt5a25wb3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMTAxOTIsImV4cCI6MjA5NDU4NjE5Mn0.TcelApqIyKL4Uv1x1M83QAcxYIKyRaGLtfQk_VbfFnc';

export function isConfigured() {
  return (
    typeof SUPABASE_URL === 'string' &&
    SUPABASE_URL.startsWith('https://') &&
    typeof SUPABASE_ANON_KEY === 'string' &&
    SUPABASE_ANON_KEY.length > 20
  );
}
