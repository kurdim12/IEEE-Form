# IEEE UoP — Team Registration

Bilingual (Arabic RTL + English) team-registration site for the **IEEE
Student Branch at the University of Petra**.

- **Frontend:** React + Vite + Tailwind (single-page app)
- **Backend:** **Supabase** (Postgres + Auth) — no server code in this repo
- **Admin dashboard:** built into the same site at `/admin`, protected by
  Supabase Auth (real email + password, not just a frontend check)

The Supabase anon key ships in the JS bundle on purpose. Real access
control comes from **Row-Level Security** on the `registrations` table:
anonymous visitors can only INSERT, only logged-in admins can read /
update / delete.

---

## One-time setup (~5 minutes)

### 1. Create the Supabase project

1. Sign up / sign in at https://supabase.com
2. **New Project** → pick any name (e.g. `ieee-uop-registration`) → choose
   a region close to Jordan (Frankfurt or London work well) → set a strong
   database password (you won't need it again — Supabase generates a
   service key from it)
3. Wait ~2 minutes for it to provision

### 2. Run the schema SQL

1. In your project, click **SQL Editor** in the left sidebar
2. Click **+ New query**
3. Open [`supabase-setup.sql`](./supabase-setup.sql) from this repo, copy
   the entire contents, paste into the SQL editor
4. Click **Run** (bottom-right). You should see "Success. No rows returned."

This creates the `registrations` table, adds a `UNIQUE` constraint on
`leader_id` (so duplicate leader registrations are blocked at the DB
layer), and sets up RLS policies.

### 3. Create your admin user

1. Sidebar ▸ **Authentication** ▸ **Users**
2. Click **Add user** (top-right) → **Create new user**
3. Fill in your email + a strong password
4. **Auto-confirm** → ✅ on (so you can log in without an email loop)
5. **Create user**

Remember this email/password — it's what you'll use to sign in at `/admin`.

### 4. Copy the keys into the code

1. Sidebar ▸ **Project Settings** (gear icon) ▸ **API**
2. Copy two values:
   - **Project URL** (looks like `https://xxxxxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
3. Open `src/lib/config.js` in this repo and paste:

   ```js
   export const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```

4. Commit the change.

Vercel auto-deploys within ~60 seconds. Open https://ieee-form.vercel.app/
to verify the form loads (no yellow banner), then `/admin` to log in.

---

## How it works

### Public form (`/`)

1. Student fills the form.
2. The page sends an INSERT to Supabase with the `anon` key.
3. RLS policy `"anon can insert"` lets it through.
4. The `UNIQUE` constraint on `leader_id` causes a `23505` Postgres error
   if the leader already registered — the UI catches that and shows:
   - AR: `تم تسجيل هذا الفريق مسبقاً بنفس الرقم الجامعي للقائد.`
   - EN: `This team is already registered with the same Leader University ID.`

### Admin dashboard (`/admin`)

1. Email + password sign-in (Supabase Auth).
2. The session token lets the page bypass anon-only restrictions, so it
   can SELECT all rows and UPDATE / DELETE freely.
3. Session is persisted in `localStorage`, so refreshing keeps you
   logged in.

Features:
- Live stats: total / by team size / by status / ungrouped
- Search across team & member names, IDs, phones
- Filters: status, group (incl. "Ungrouped"), team size
- Inline **Status** pill (`New` / `Contacted` / `Confirmed` / `Rejected`)
  — click to change, saves instantly
- Inline **Group** pill (`A` through `H` plus blank) — same UX
- CSV export of whatever's currently filtered
- Delete with confirm prompt

---

## Local development

```bash
npm install
npm run dev
```

As long as `src/lib/config.js` has valid Supabase credentials,
`http://localhost:5173` is fully wired up — submissions write to the
real database.

---

## Validation rules

| Field           | Rule                                          |
| --------------- | --------------------------------------------- |
| Team name       | ≥ 2 characters                                |
| Team size       | `2` or `3` (also enforced in DB)              |
| Full name       | ≥ 3 characters                                |
| University ID   | Exactly 9 digits (`^\d{9}$`)                  |
| Major           | Required (dropdown)                           |
| Phone           | Jordanian mobile: `^(\+962\|0)?7[789]\d{7}$`  |
| Leader ID       | Unique across all teams (DB constraint)       |

Zod validates client-side; the DB constraints catch anything that
slips through.

---

## Project structure

```
ieee-uop-registration/
├── supabase-setup.sql            # paste-once schema bootstrap
├── public/
│   ├── logo.png                  # IEEE x UoP combined logo
│   └── logo.svg                  # fallback placeholder
├── src/
│   ├── components/
│   │   ├── Admin.jsx             # /admin dashboard (Supabase Auth)
│   │   ├── Header.jsx            # form header
│   │   └── ...                   # MemberForm, TeamSizeSelector, etc.
│   ├── lib/
│   │   ├── admin-api.js          # admin reads / writes (+ auth helpers)
│   │   ├── api.js                # form INSERT
│   │   ├── config.js             # ← URL + anon key live here
│   │   ├── i18n.js               # AR + EN strings, majors list
│   │   ├── schema.js             # Zod validation
│   │   └── supabase.js           # singleton client
│   ├── App.jsx                   # registration form
│   ├── index.css
│   └── main.jsx                  # routes /admin → Admin, else → App
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
└── vite.config.js
```

---

## Troubleshooting

**Yellow "Supabase is not configured" banner** — `SUPABASE_URL` or
`SUPABASE_ANON_KEY` is empty or malformed in `src/lib/config.js`.

**Form submit fails with "duplicate"** — working as intended. Someone
already registered with that Leader University ID.

**Form submit fails with another error** — usually means the RLS policy
isn't set up. Re-run `supabase-setup.sql` in the SQL editor.

**Can't log in to `/admin`** — double-check you created the user in
**Authentication ▸ Users** with **Auto-confirm = on**. Without
auto-confirm Supabase sends a verification email first.

**Admin loads but shows no rows even though there are submissions** —
RLS isn't letting the authenticated user read. Re-run the policy
block in `supabase-setup.sql`.

---

## Security notes

- The anon key is **designed** to be exposed in client code — that's
  what RLS is for.
- The admin password is whatever you set when creating the user in
  Supabase Auth. Use a strong one and don't share it.
- If you suspect the admin password leaked, change it in Supabase
  ▸ Authentication ▸ Users (click the user ▸ Send password reset, or
  delete and recreate).
- After the event ends you can pause or delete the Supabase project
  to take everything offline in one click.
