# IEEE UoP — Team Registration

Bilingual (Arabic RTL + English) team-registration site for the **IEEE
Student Branch at the University of Petra**.

- **Frontend:** React + Vite + Tailwind (single-page app)
- **Backend:** none — the page talks to **Airtable** directly
- **Where you see responses:** in your Airtable base — sortable, filterable,
  drag-and-drop kanban for grouping teams

> ⚠️ **Short-event configuration.** The Airtable token lives in
> `src/lib/config.js` and ships in the public JavaScript bundle. This is
> the right trade-off for a 2-3 day event but **not** for ongoing use.
> See **Security cleanup** at the bottom — rotate the token and delete
> the base when the event is over.

---

## One-time setup (~5 minutes)

### Step 1 — Get your Airtable token

1. Go to https://airtable.com/create/tokens
2. Click **Create new token**
3. **Name:** `IEEE Form`
4. **Scopes** — add all four:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
   - `schema.bases:write`
5. **Access:** select your `IEEE UoP Registrations` base
6. Click **Create token**, copy the `pat...` string

### Step 2 — Paste the token into the code

Edit **`src/lib/config.js`** — it's a tiny file:

```js
export const AIRTABLE_TOKEN = '';                    // paste here ↘
export const AIRTABLE_BASE_ID = 'appJZtjKuHRmJdwqt';
export const AIRTABLE_TABLE_ID = 'tblEN5ajH7Qz0nLG7';
```

Set `AIRTABLE_TOKEN` to your `pat...` value. Leave the other two unless
you switch bases. Commit the change.

> If `AIRTABLE_BASE_ID` / `AIRTABLE_TABLE_ID` ever change, get them from
> your base's URL: `airtable.com/<base>/<table>/<view>`.

### Step 3 — Deploy (or let Vercel auto-redeploy)

If the repo is already on Vercel, pushing the commit triggers an auto
deploy. Otherwise import the repo at https://vercel.com — no env vars
needed, no config — just deploy.

### Step 4 — First visit creates the Airtable fields

The first time anyone opens the form after submitting, the page makes
sure all 18 fields exist in your base (Team Name, Team Size, Leader
Name, ..., Status, Group, Submitted At). After that it's cached in the
browser's localStorage, so subsequent visits skip the check.

If a field is missing, the page recreates it automatically.

---

## How submissions flow

1. Student fills the form on the deployed site.
2. The page sends the data straight to the Airtable REST API.
3. A new row appears in your `Submissions` table within ~2 seconds.

There is no server. No Apps Script. No Vercel function. No env vars to
configure.

---

## Where you see (and organize) responses

You have **two ways** to view and manage registrations:

### Option 1 — Built-in admin page (recommended)

Open `https://<your-site>.vercel.app/admin` in your browser. Log in with
the password set in `src/lib/config.js` (default: `ieee-uop-2026` — change
it before sharing!). You get:

- **Live stats** at the top — total teams, by size, by status, ungrouped count
- **Search** by team name, leader/member name, university ID, or phone
- **Filter** by status, group, or team size
- **Inline edits** — click the Status or Group pill on any row, pick a
  value, it saves automatically to Airtable
- **CSV export** of whatever's currently filtered
- **Delete** rows that shouldn't be there

Changes propagate back to Airtable in real time, so your committee can
work from either side.

### Option 2 — Airtable directly

Open your Airtable base. Every submission is a new row. Useful for:

- **Kanban view** — toolbar ▸ Kanban grouped by `Group` to drag teams
  between buckets visually
- **Sharing with non-tech committee members** — top-right Share button
- **Mobile** — Airtable iOS / Android apps

---

## Local development (optional)

```bash
npm install
npm run dev
```

The dev server uses the same config as production. As long as
`src/lib/config.js` has a valid token, `npm run dev` lets you test on
http://localhost:5173 and submissions go to the real Airtable base.

---

## Duplicate prevention

Before creating a row, the page checks whether the **Leader's University
ID** already exists. If it does, the UI shows:

- AR: `تم تسجيل هذا الفريق مسبقاً بنفس الرقم الجامعي للقائد.`
- EN: `This team is already registered with the same Leader University ID.`

Members can be on multiple teams — only the leader's ID is the dedupe
key.

---

## Validation rules

| Field           | Rule                                          |
| --------------- | --------------------------------------------- |
| Team name       | ≥ 2 characters                                |
| Team size       | `2` or `3`                                    |
| Full name       | ≥ 3 characters                                |
| University ID   | Exactly 9 digits (`^\d{9}$`)                  |
| Major           | Required (dropdown)                           |
| Phone           | Jordanian mobile: `^(\+962\|0)?7[789]\d{7}$`  |

---

## Project structure

```
ieee-uop-registration/
├── public/
│   ├── logo.png                 # IEEE x UoP combined logo
│   └── logo.svg                 # fallback placeholder
├── src/
│   ├── components/
│   │   ├── Admin.jsx            # /admin dashboard (password protected)
│   │   ├── Header.jsx           # form header
│   │   └── ...                  # MemberForm, TeamSizeSelector, etc.
│   ├── lib/
│   │   ├── admin-api.js         # Admin: list / update / delete records
│   │   ├── airtable.js          # Form: schema bootstrap + create record
│   │   ├── api.js               # Submission entry point
│   │   ├── config.js            # ⚠️ token + base/table + admin pw
│   │   ├── i18n.js              # AR + EN strings, majors list
│   │   └── schema.js            # Zod validation
│   ├── App.jsx                  # registration form
│   ├── index.css
│   └── main.jsx                 # routes /admin → Admin, else → App
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## Security cleanup — after the event ends

1. **Rotate the token** — https://airtable.com/create/tokens → delete the
   `IEEE Form` token. This invalidates the value that's baked into the
   public bundle so even if someone saved it, it stops working.
2. **(Optional)** Delete the Airtable base if it held sensitive data.
3. **(Optional)** Make the GitHub repo private if you don't want anyone
   reading the old token from git history (rotation in step 1 makes the
   token useless anyway, so this is belt-and-suspenders).

---

## Troubleshooting

**Yellow "Airtable token is not set" banner on the form** — `AIRTABLE_TOKEN`
in `src/lib/config.js` is empty. Edit, paste your `pat...` value, commit.

**Toast: "Could not initialize the database"** — the token is missing
the `schema.bases:read` / `schema.bases:write` scopes. Update the token
at https://airtable.com/create/tokens.

**Toast: "Network error" when submitting** — open dev tools Network tab
and look at the failing Airtable request. Usually means the base ID or
table ID in `config.js` doesn't match.

**Submissions land but a field is empty** — make sure the field names in
your Airtable base haven't been renamed. The bootstrap created them as
`Team Name`, `Team Size`, `Leader Name`, etc. — don't change them or
the page won't know where to write.

---

## License

Built for the IEEE Student Branch at the University of Petra. Use freely.
