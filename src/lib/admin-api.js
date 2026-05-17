import { getSupabase, TABLE } from './supabase.js';

function client() {
  const c = getSupabase();
  if (!c) throw new Error('Supabase not configured. Edit src/lib/config.js');
  return c;
}

export async function fetchAllRecords() {
  const { data, error } = await client()
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateRecord(id, patch) {
  const { error } = await client().from(TABLE).update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteRecord(id) {
  const { error } = await client().from(TABLE).delete().eq('id', id);
  if (error) throw error;
}

export async function signIn(email, password) {
  const { error } = await client().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  await client().auth.signOut();
}

export async function getSession() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(cb) {
  const supabase = getSupabase();
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}
