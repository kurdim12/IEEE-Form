import { useEffect, useMemo, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

import { ADMIN_PASSWORD, isConfigured } from '../lib/config.js';
import { fetchAllRecords, updateRecord, deleteRecord } from '../lib/admin-api.js';
import Logo from './Logo.jsx';

const AUTH_KEY = 'ieee-form-admin-auth-v1';
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

function getInitialAuth() {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(AUTH_KEY) === 'yes';
}

export default function Admin() {
  const [authed, setAuthed] = useState(getInitialAuth);
  const [pwInput, setPwInput] = useState('');
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
    if (authed) refresh();
  }, [authed]);

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

  function handleLogin(e) {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      window.sessionStorage.setItem(AUTH_KEY, 'yes');
      setAuthed(true);
      setPwInput('');
    } else {
      toast.error('Wrong password');
    }
  }

  function logout() {
    window.sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  }

  async function patchField(recordId, field, value) {
    const next = records.map((r) =>
      r.id === recordId ? { ...r, fields: { ...r.fields, [field]: value || undefined } } : r,
    );
    setRecords(next);
    try {
      await updateRecord(recordId, { [field]: value || null });
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
      refresh();
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
      acc[s] = records.filter((r) => r.fields.Status === s).length;
      return acc;
    }, {});
    const byGroup = {};
    for (const g of GROUP_OPTIONS) {
      if (!g) continue;
      byGroup[g] = records.filter((r) => r.fields.Group === g).length;
    }
    const ungrouped = records.filter((r) => !r.fields.Group).length;
    const teams2 = records.filter((r) => String(r.fields['Team Size']) === '2').length;
    const teams3 = records.filter((r) => String(r.fields['Team Size']) === '3').length;
    return { total, byStatus, byGroup, ungrouped, teams2, teams3 };
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const f = r.fields;
      if (statusFilter !== 'all' && (f.Status || 'New') !== statusFilter) return false;
      if (groupFilter !== 'all') {
        if (groupFilter === '_none' && f.Group) return false;
        if (groupFilter !== '_none' && f.Group !== groupFilter) return false;
      }
      if (sizeFilter !== 'all' && String(f['Team Size']) !== sizeFilter) return false;
      if (!q) return true;
      const haystack = [
        f['Team Name'],
        f['Leader Name'],
        f['Leader ID'],
        f['Leader Phone'],
        f['Member 2 Name'],
        f['Member 2 ID'],
        f['Member 2 Phone'],
        f['Member 3 Name'],
        f['Member 3 ID'],
        f['Member 3 Phone'],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [records, search, statusFilter, groupFilter, sizeFilter]);

  function exportCSV() {
    const cols = [
      'Team Name',
      'Team Size',
      'Status',
      'Group',
      'Leader Name',
      'Leader ID',
      'Leader Major',
      'Leader Phone',
      'Member 2 Name',
      'Member 2 ID',
      'Member 2 Major',
      'Member 2 Phone',
      'Member 3 Name',
      'Member 3 ID',
      'Member 3 Major',
      'Member 3 Phone',
      'Language',
      'Submitted At',
    ];
    const escape = (v) => {
      const s = String(v == null ? '' : v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [cols.join(',')];
    for (const r of filtered) {
      lines.push(cols.map((c) => escape(r.fields[c])).join(','));
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
          Add your Airtable token in <code className="rounded bg-amber-100 px-1.5 py-0.5">src/lib/config.js</code> and redeploy.
        </p>
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

          {authed && (
            <div className="flex items-center gap-2">
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
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      {!authed ? (
        <div className="mx-auto mt-24 max-w-md px-4">
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleLogin}
            className="rounded-3xl border border-slate-100 bg-white p-8 shadow-card"
          >
            <h1 className="mb-1 text-2xl font-extrabold text-slate-900">Admin login</h1>
            <p className="mb-6 text-sm text-slate-500">Enter the admin password to view registrations.</p>
            <input
              type="password"
              autoFocus
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              placeholder="Password"
              className="field-input"
            />
            <button type="submit" className="btn-primary mt-4 w-full">
              Sign in
            </button>
          </motion.form>
        </div>
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {/* Stats */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            <StatCard label="Total teams" value={stats.total} accent="ieee" />
            <StatCard label="Teams of 2" value={stats.teams2} />
            <StatCard label="Teams of 3" value={stats.teams3} />
            <StatCard label="New" value={stats.byStatus.New} />
            <StatCard label="Confirmed" value={stats.byStatus.Confirmed} accent="emerald" />
            <StatCard label="Ungrouped" value={stats.ungrouped} accent="amber" />
          </div>

          {/* Filters */}
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
            <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}>
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Group" value={groupFilter} onChange={setGroupFilter}>
              <option value="all">All groups</option>
              <option value="_none">Ungrouped</option>
              {GROUP_OPTIONS.filter(Boolean).map((g) => (
                <option key={g} value={g}>Group {g}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Size" value={sizeFilter} onChange={setSizeFilter}>
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

          {/* Table */}
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
                          <div className="font-bold text-slate-900">{rec.fields['Team Name'] || '—'}</div>
                          <div className="text-xs text-slate-400">{rec.fields.Language || ''}</div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-slate-100 px-2 text-xs font-bold text-slate-700">
                            {rec.fields['Team Size'] || '?'}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <PillSelect
                            value={rec.fields.Status || 'New'}
                            onChange={(v) => patchField(rec.id, 'Status', v)}
                            options={STATUS_OPTIONS}
                            styles={STATUS_STYLES}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <PillSelect
                            value={rec.fields.Group || ''}
                            onChange={(v) => patchField(rec.id, 'Group', v)}
                            options={GROUP_OPTIONS}
                            labels={{ '': '—' }}
                            styles={GROUP_STYLES}
                            placeholderClass="bg-slate-100 text-slate-500"
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-slate-900">{rec.fields['Leader Name'] || '—'}</div>
                          <div className="text-xs text-slate-500">{rec.fields['Leader ID'] || ''}</div>
                          <div className="text-xs text-slate-500">{rec.fields['Leader Phone'] || ''}</div>
                          <div className="text-xs text-slate-400">{rec.fields['Leader Major'] || ''}</div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <MemberRow rec={rec} idx={2} />
                          {rec.fields['Member 3 Name'] && (
                            <MemberRow rec={rec} idx={3} className="mt-2" />
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-slate-500 whitespace-nowrap">
                          {rec.fields['Submitted At']
                            ? new Date(rec.fields['Submitted At']).toLocaleString()
                            : '—'}
                        </td>
                        <td className="px-4 py-3 align-top text-end">
                          <button
                            type="button"
                            onClick={() => handleDelete(rec.id, rec.fields['Team Name'] || 'this team')}
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
            Tip: changes to Status and Group save automatically. Refresh to pull new submissions.
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

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-ieee focus:outline-none focus:ring-2 focus:ring-ieee/15"
      >
        {children}
      </select>
    </label>
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

function MemberRow({ rec, idx, className = '' }) {
  const name = rec.fields[`Member ${idx} Name`];
  const id = rec.fields[`Member ${idx} ID`];
  const phone = rec.fields[`Member ${idx} Phone`];
  const major = rec.fields[`Member ${idx} Major`];
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
