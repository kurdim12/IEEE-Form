# IEEE UoP — Team Registration

Bilingual (Arabic RTL + English) team-registration site for the **IEEE
Student Branch at the University of Petra**.

- **Frontend:** React + Vite + Tailwind, single-page app
- **Backend:** Vercel serverless function (`/api/submit`) that writes to
  **Airtable**
- **Where you see responses:** in your Airtable base — sortable, filterable,
  drag-and-drop kanban for grouping teams

The Airtable token is server-side only; it never reaches the browser.

---

## Quick reference

| Command          | What it does                                        |
| ---------------- | --------------------------------------------------- |
| `npm install`    | Install dependencies                                |
| `npm run setup`  | One-time: create all Airtable fields automatically  |
| `npm run dev`    | Run the site locally on http://localhost:5173       |
| `npm run build`  | Build production bundle to `dist/`                  |

---

## 1. Airtable setup (~3 minutes)

1. Sign up / sign in at https://airtable.com.
2. Create a new base named **`IEEE UoP Registrations`** (start from scratch).
3. Go to https://airtable.com/create/tokens and click **Create new token**.
   - **Name:** `IEEE Form`
   - **Scopes (add all four):**
     - `data.records:read`
     - `data.records:write`
     - `schema.bases:read`
     - `schema.bases:write`
   - **Access:** select the base you just created.
   - Click **Create token** and copy the value (starts with `pat...`).
4. From your base's URL, copy:
   - The **base ID** (segment that starts with `app...`).
   - The **table ID** (segment that starts with `tbl...`).

   Example URL: `https://airtable.com/appXXXX/tblYYYY/viwZZZZ`  
   → Base ID: `appXXXX`, Table ID: `tblYYYY`.

---

## 2. Run the one-time field setup

Either locally (if you have Node 20.6+ installed) **or** in a free GitHub
Codespace (Code button on the repo → Codespaces → Create codespace on
this branch).

```bash
npm install
cp .env.example .env
# Edit .env and paste your token + base ID + table ID
npm run setup
```

You should see output like:

```
✓ Team Size           created (singleSelect)
✓ Leader Name         created (singleLineText)
✓ Leader ID           created (singleLineText)
...
✓ Group               created (singleSelect)
✓ Submitted At        created (createdTime)

Done. Open your base in Airtable to confirm.
```

Refresh your Airtable base — every field is now there.

After the setup runs successfully, you can **narrow the token's scopes**
back down to just `data.records:read` and `data.records:write` for
ongoing use. The schema scopes are only needed for the one-time setup.

---

## 3. Deploy to Vercel

1. Push the repo to GitHub.
2. https://vercel.com → **Add new ▸ Project** → import the repo.
3. Framework auto-detects Vite. Leave the defaults.
4. **Add three Environment Variables** (Settings ▸ Environment Variables):
   - `AIRTABLE_TOKEN` → your `pat...` value
   - `AIRTABLE_BASE_ID` → `app...`
   - `AIRTABLE_TABLE_ID` → `tbl...`

   ⚠️ Do **not** prefix these with `VITE_`. They must stay server-side.
5. Click **Deploy**.

When it finishes you get a `*.vercel.app` URL — that's the form to share.

> Updating the token later? Vercel will use the new value on the next
> deploy. Trigger one via **Deployments ▸ ⋯ ▸ Redeploy** if needed.

---

## 4. Local development

```bash
npm install
cp .env.example .env
# Paste your credentials
npm run dev
```

Open http://localhost:5173. The Vite dev server includes a built-in
middleware that handles `POST /api/submit` exactly like the Vercel
function would, so the local form really does write to your Airtable.

---

## 5. Where you see responses (and how to organize them)

Open your Airtable base. Every submission becomes a new row. The schema
setup already created two fields specifically for organizing teams:

- **Group** — single-select with options A through H, each a different
  colour. Switch to **Kanban view** (toolbar ▸ Kanban) grouped by this
  field to drag teams between groups visually.
- **Status** — single-select: `New`, `Contacted`, `Confirmed`, `Rejected`.
  Track where each team is in your workflow.

Other things you can do directly in Airtable:
- **Share with your committee** (Share button, top-right) — read or edit.
- **Sort / filter** by major, team size, status, group — toolbar.
- **Create views** (Grid, Kanban, Calendar, Gallery) for different angles.
- **Export to CSV** — view menu ▸ Download CSV.
- **Mobile** — the Airtable app on iOS / Android works on the same base.

---

## How duplicate prevention works

Before creating a row, `/api/submit` checks whether the **Leader's
University ID** already exists. If it does, the server returns
`{ success: false, error: "duplicate" }` and the UI shows:

- AR: `تم تسجيل هذا الفريق مسبقاً بنفس الرقم الجامعي للقائد.`
- EN: `This team is already registered with the same Leader University ID.`

Same dedupe key whether you submit from production or local dev.

---

## Validation rules (frontend + backend)

| Field           | Rule                                          |
| --------------- | --------------------------------------------- |
| Team name       | ≥ 2 characters                                |
| Team size       | `2` or `3`                                    |
| Full name       | ≥ 3 characters                                |
| University ID   | Exactly 9 digits (`^\d{9}$`)                  |
| Major           | Required (dropdown)                           |
| Phone           | Jordanian mobile: `^(\+962\|0)?7[789]\d{7}$`  |

Both the React form and the serverless function enforce these — a
malicious client can't bypass the server check.

---

## Project structure

```
ieee-uop-registration/
├── api/
│   └── submit.js                # Vercel serverless POST endpoint
├── lib/
│   └── airtable.js              # Core handler (used by api/ and vite dev)
├── scripts/
│   └── setup-airtable.mjs       # One-time schema bootstrap
├── public/
│   ├── logo.png                 # IEEE x UoP combined logo
│   └── logo.svg                 # fallback placeholder
├── src/
│   ├── components/              # Header, MemberForm, etc.
│   ├── lib/
│   │   ├── api.js               # POST helper
│   │   ├── i18n.js              # AR + EN strings, majors list
│   │   └── schema.js            # Zod validation
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env.example
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
└── vite.config.js
```

---

## Troubleshooting

**`Missing env var: AIRTABLE_TOKEN` in dev** — you didn't copy
`.env.example` to `.env` or didn't fill in all three values.

**Setup script fails with `INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND`** — the
token is missing `schema.bases:read` or `schema.bases:write`. Update the
token at https://airtable.com/create/tokens and re-run.

**Form submit fails with `airtable_error`** — open the Network tab in dev
tools and look at `/api/submit` response. The `detail` field has the raw
Airtable error message. Usually means a field name was renamed in
Airtable (don't rename the fields the setup script creates).

**Vercel deploy succeeds but submits 500** — env vars aren't set in
Vercel. Settings ▸ Environment Variables ▸ make sure all three are
filled in for **Production** (and Preview if you use preview deploys).

---

## License

Built for the IEEE Student Branch at the University of Petra. Use freely.
