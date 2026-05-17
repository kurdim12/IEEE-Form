import { useEffect, useMemo, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

import { isConfigured } from '../lib/config.js';
import {
  fetchAllRecords,
  updateRecord,
  deleteRecord,
  signIn,
  signOut,
  getSession,
  onAuthChange,
} from '../lib/admin-api.js';
import Logo from './Logo.jsx';

const STATUS_OPTIONS = ['New', 'Contacted', 'Confirmed', 'Rejected'];
const GROUP_OPTIONS = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const STATUS_STYLES = {
  New: 'bg-blue-100 text-blue-800 ring-blue-200',
  Contacted: 'bg-amber-100 text-amber-800 ring-amber-200',
  Confirmed: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  Rejected: 'bg-red-100 text-red-800 ring-red-200',
};

const GROUP_STYLES = {
  A: 'bg-cyan-100 text-cyan-800',
  B: 'bg-teal-100 text-teal-800',
  C: 'bg-emerald-100 text-emerald-800',
  D: 'bg-amber-100 text-amber-800',
  E: 'bg-orange-100 text-orange-800',
  F: 'bg-red-100 text-red-800',
  G: 'bg-pink-100 text-pink-800',
  H: 'bg-purple-100 text-purple-800',
};

export default function Admin() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
      document.title = 'IEEE UoP — Admin';
    }
  }, []);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const initial = await getSession();
      setSession(initial);
      setCheckingSession(false);
      unsub = onAuthChange((s) => setSession(s));
    })();
    return () => unsub();
  }, []);

  useEffect(() => {
    if (session) refresh();
  }, [session]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllRecords();
      setRecords(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setSigningIn(true);
    try {
      await signIn(email, password);
      setEmail('');
      setPassword('');
    } catch (err) {
      toast.error(err.message || 'Sign-in failed');
    } finally {
      setSigningIn(false);
    }
  }

  async function handleLogout() {
    await signOut();
  }

  async function patchField(recordId, field, value) {
    const previous = records;
    setRecords((rs) =>
      rs.map((r) => (r.id === recordId ? { ...r, [field]: value || null } : r)),
    );
    try {
      await updateRecord(recordId, { [field]: value || null });
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
      setRecords(previous);
    }
  }

  async function handleDelete(recordId, teamName) {
    if (!window.confirm(`Delete team "${teamName}"? This cannot be undone.`)) return;
    try {
      await deleteRecord(recordId);
      setRecords((rs) => rs.filter((r) => r.id !== recordId));
      toast.success('Deleted');
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    }
  }

  const stats = useMemo(() => {
    const total = records.length;
    const byStatus = STATUS_OPTIONS.reduce((acc, s) => {
      acc[s] = records.filter((r) => (r.status || 'New') === s).length;
      return acc;
    }, {});
    const ungrouped = records.filter((r) => !r.group_letter).length;
    const teams2 = records.filter((r) => String(r.team_size) === '2').length;
    const teams3 = records.filter((r) => String(r.team_size) === '3').length;
    return { total, byStatus, ungrouped, teams2, teams3 };
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter !== 'all' && (r.status || 'New') !== statusFilter) return false;
      if (groupFilter !== 'all') {
        if (groupFilter === '_none' && r.group_letter) return false;
        if (groupFilter !== '_none' && r.group_letter !== groupFilter) return false;
      }
      if (sizeFilter !== 'all' && String(r.team_size) !== sizeFilter) return false;
      if (!q) return true;
      const haystack = [
        r.team_name,
        r.leader_name,
        r.leader_id,
        r.leader_phone,
        r.member2_name,
        r.member2_id,
        r.member2_phone,
        r.member3_name,
        r.member3_id,
        r.member3_phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [records, search, statusFilter, groupFilter, sizeFilter]);

  function exportCSV() {
    const cols = [
      ['team_name', 'Team Name'],
      ['team_size', 'Team Size'],
      ['status', 'Status'],
      ['group_letter', 'Group'],
      ['leader_name', 'Leader Name'],
      ['leader_id', 'Leader ID'],
      ['leader_major', 'Leader Major'],
      ['leader_phone', 'Leader Phone'],
      ['member2_name', 'Member 2 Name'],
      ['member2_id', 'Member 2 ID'],
      ['member2_major', 'Member 2 Major'],
      ['member2_phone', 'Member 2 Phone'],
      ['member3_name', 'Member 3 Name'],
      ['member3_id', 'Member 3 ID'],
      ['member3_major', 'Member 3 Major'],
      ['member3_phone', 'Member 3 Phone'],
      ['language', 'Language'],
      ['created_at', 'Submitted At'],
    ];
    const escape = (v) => {
      const s = String(v == null ? '' : v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [cols.map(([, label]) => label).join(',')];
    for (const r of filtered) {
      lines.push(cols.map(([key]) => escape(r[key])).join(','));
    }
    const csv = lines.join('\n');
    const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ieee-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!isConfigured()) {
    return (
      <div className="mx-auto mt-24 max-w-md rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h1 className="mb-2 text-2xl font-bold text-amber-900">Not configured</h1>
        <p className="text-sm text-amber-800">
          Add your Supabase URL + anon key in{' '}
          <code className="rounded bg-amber-100 px-1.5 py-0.5">src/lib/config.js</code> and redeploy.
        </p>
      </div>
    );
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" />

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-3">
            <Logo name="logo" alt="IEEE UoP" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-slate-900">IEEE UoP — Admin</div>
              <div className="text-xs text-slate-500">Team registrations dashboard</div>
            </div>
          </a>

          {session && (
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-slate-500 sm:inline">{session.user.email}</span>
              <button
                type="button"
                onClick={refresh}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <svg className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 15.5-6.5L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-15.5 6.5L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                Refresh
              </button>
              <button
                type="button"
                onClick={exportCSV}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                CSV
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      {!session ? (
        <div className="mx-auto mt-24 max-w-md px-4">
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleLogin}
            className="rounded-3xl border border-slate-100 bg-white p-8 shadow-card"
          >
            <h1 className="mb-1 text-2xl font-extrabold text-slate-900">Admin login</h1>
            <p className="mb-6 text-sm text-slate-500">
              Sign in with the admin user you created in Supabase ▸ Authentication.
            </p>
            <label className="field-label" htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ieee-uop.example"
              className="field-input mb-4"
            />
            <label className="field-label" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input"
            />
            <button type="submit" disabled={signingIn} className="btn-primary mt-5 w-full">
              {signingIn ? 'Signing in…' : 'Sign in'}
            </button>
          </motion.form>
        </div>
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <StatCard label="Total teams" value={stats.total} accent="ieee" />
            <StatCard label="Teams of 2" value={stats.teams2} />
            <StatCard label="Teams of 3" value={stats.teams3} />
            <StatCard label="New" value={stats.byStatus.New} />
            <StatCard label="Confirmed" value={stats.byStatus.Confirmed} accent="emerald" />
            <StatCard label="Ungrouped" value={stats.ungrouped} accent="amber" />
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team / name / ID / phone…"
                className="field-input !py-2 ps-9"
              />
              <svg className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <FilterSelect value={statusFilter} onChange={setStatusFilter}>
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </FilterSelect>
            <FilterSelect value={groupFilter} onChange={setGroupFilter}>
              <option value="all">All groups</option>
              <option value="_none">Ungrouped</option>
              {GROUP_OPTIONS.filter(Boolean).map((g) => (
                <option key={g} value={g}>Group {g}</option>
              ))}
            </FilterSelect>
            <FilterSelect value={sizeFilter} onChange={setSizeFilter}>
              <option value="all">Any size</option>
              <option value="2">Teams of 2</option>
              <option value="3">Teams of 3</option>
            </FilterSelect>
            <span className="ms-auto text-sm font-semibold text-slate-500">
              {filtered.length} {filtered.length === 1 ? 'team' : 'teams'}
            </span>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <Th>Team</Th>
                    <Th>Size</Th>
                    <Th>Status</Th>
                    <Th>Group</Th>
                    <Th>Leader</Th>
                    <Th>Members</Th>
                    <Th>Submitted</Th>
                    <Th className="text-end">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence initial={false}>
                    {filtered.map((rec) => (
                      <motion.tr
                        key={rec.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="font-bold text-slate-900">{rec.team_name || '—'}</div>
                          <div className="text-xs text-slate-400">{rec.language || ''}</div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-slate-100 px-2 text-xs font-bold text-slate-700">
                            {rec.team_size || '?'}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <PillSelect
                            value={rec.status || 'New'}
                            onChange={(v) => patchField(rec.id, 'status', v)}
                            options={STATUS_OPTIONS}
                            styles={STATUS_STYLES}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <PillSelect
                            value={rec.group_letter || ''}
                            onChange={(v) => patchField(rec.id, 'group_letter', v)}
                            options={GROUP_OPTIONS}
                            labels={{ '': '—' }}
                            styles={GROUP_STYLES}
                            placeholderClass="bg-slate-100 text-slate-500"
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-slate-900">{rec.leader_name || '—'}</div>
                          <div className="text-xs text-slate-500">{rec.leader_id || ''}</div>
                          <div className="text-xs text-slate-500">{rec.leader_phone || ''}</div>
                          <div className="text-xs text-slate-400">{rec.leader_major || ''}</div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <MemberBlock rec={rec} idx={2} />
                          {rec.member3_name && <MemberBlock rec={rec} idx={3} className="mt-2" />}
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-slate-500 whitespace-nowrap">
                          {rec.created_at ? new Date(rec.created_at).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 align-top text-end">
                          <button
                            type="button"
                            onClick={() => handleDelete(rec.id, rec.team_name || 'this team')}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">
                        {records.length === 0
                          ? 'No registrations yet. The first submission will appear here.'
                          : 'No teams match your filters.'}
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                        Loading…
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Tip: changes to Status and Group save instantly. Use Refresh to pull new submissions.
          </p>
        </main>
      )}
    </div>
  );
}

function StatCard({ label, value, accent = 'slate' }) {
  const accents = {
    slate: 'bg-white border-slate-200',
    ieee: 'bg-ieee-50 border-ieee-200',
    emerald: 'bg-emerald-50 border-emerald-200',
    amber: 'bg-amber-50 border-amber-200',
  };
  return (
    <div className={`rounded-2xl border p-3 ${accents[accent] || accents.slate}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-slate-900">{value ?? 0}</div>
    </div>
  );
}

function FilterSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-ieee focus:outline-none focus:ring-2 focus:ring-ieee/15"
    >
      {children}
    </select>
  );
}

function PillSelect({ value, onChange, options, labels = {}, styles = {}, placeholderClass = '' }) {
  const display = labels[value] ?? value;
  const styleClass = styles[value] || placeholderClass || 'bg-slate-100 text-slate-700';
  return (
    <span className={`relative inline-flex items-center rounded-full ring-1 ring-inset ${styleClass} ring-current/10`}>
      <span className="pointer-events-none px-2.5 py-1 text-xs font-bold">
        {display || '—'}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{labels[opt] ?? opt ?? '—'}</option>
        ))}
      </select>
    </span>
  );
}

function MemberBlock({ rec, idx, className = '' }) {
  const name = rec[`member${idx}_name`];
  const id = rec[`member${idx}_id`];
  const phone = rec[`member${idx}_phone`];
  const major = rec[`member${idx}_major`];
  if (!name) return null;
  return (
    <div className={className}>
      <div className="text-sm font-semibold text-slate-900">{name}</div>
      <div className="text-xs text-slate-500">{id} · {phone}</div>
      <div className="text-xs text-slate-400">{major}</div>
    </div>
  );
}

function Th({ children, className = '' }) {
  return (
    <th className={`px-4 py-3 text-start font-semibold text-slate-500 ${className}`}>{children}</th>
  );
}
