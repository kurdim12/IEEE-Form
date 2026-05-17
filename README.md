# IEEE UoP — Team Registration

Bilingual (Arabic RTL + English) team-registration website for the **IEEE
Student Branch at the University of Petra**. The frontend is a React + Vite
+ Tailwind single-page app; the "backend" is a Google Apps Script Web App
that appends each submission as a row in a Google Sheet — no server, no
database, no paid services.

---

## Quick start

```bash
npm install
cp .env.example .env
# Paste your Apps Script Web App URL into .env (see "Setup Google Sheet" below)
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`).

---

## 1. Setup the Google Sheet + Apps Script backend

1. Create a new Google Sheet, name it **`IEEE UoP Registrations`**.
2. From the menu choose **Extensions → Apps Script**. A new Apps Script
   project opens.
3. Delete the default `Code.gs` contents and paste the contents of
   [`apps-script/Code.gs`](./apps-script/Code.gs).
4. Save (💾) and rename the project to `IEEE UoP Registration Backend`.
5. In the function dropdown choose **`setupSheet`** then click **Run**.
   - The first run will ask for permissions. Allow them (you may need to
     click "Advanced ▸ Go to project (unsafe)" because the script is
     unverified — that's normal for personal Apps Scripts).
   - This creates a `Submissions` sheet with the correct header row.
6. Click **Deploy ▸ New deployment**.
   - Click the gear icon and pick **Web app**.
   - **Description:** `IEEE UoP Registration v1`
   - **Execute as:** `Me (your-email)`
   - **Who has access:** `Anyone`
   - Click **Deploy**.
7. Copy the **Web app URL**. It looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
8. Open the URL in a browser as a smoke test — you should see
   `{"success":true,"service":"IEEE UoP Registration","version":1}`.

> **Updating the script later:** if you edit `Code.gs` after the first
> deployment, use **Deploy ▸ Manage deployments**, click the pencil icon,
> set **Version → New version**, and **Deploy**. The URL stays the same.

---

## 2. Local development

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
```

Then:

```bash
npm run dev
```

The site is mobile-first. Test from a phone on the same Wi-Fi by visiting
the **Network** URL Vite prints.

### Scripts

| Command           | What it does                              |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Vite dev server with hot reload           |
| `npm run build`   | Build production bundle to `dist/`        |
| `npm run preview` | Serve the production build locally        |

---

## 3. Deploy to Vercel

1. Push the repo to GitHub.
2. Go to [vercel.com](https://vercel.com), click **Add new ▸ Project**, and
   import the GitHub repo.
3. Framework preset auto-detects **Vite**. Leave defaults.
4. Under **Environment Variables** add:
   - Key: `VITE_APPS_SCRIPT_URL`
   - Value: your Apps Script Web App URL
5. Click **Deploy**.

When the deploy is done you'll get a `*.vercel.app` URL — share it with
the students who need to register.

> **Heads up:** if you update `VITE_APPS_SCRIPT_URL` later you must trigger
> a fresh build (Vercel ▸ Deployments ▸ ⋯ ▸ Redeploy). Vite inlines `VITE_*`
> values at build time.

---

## 4. Add real logos

Drop the official PNG logos into `public/`:

- `public/uop-logo.png` — University of Petra logo
- `public/ieee-logo.png` — IEEE logo

Recommended dimensions: square or 4:3, transparent background, at least
256×256 px. The header element renders at `~56–64 px` tall.

If a PNG is missing, the app automatically falls back to the bundled SVG
placeholders (`uop-logo.svg`, `ieee-logo.svg`) so the layout never breaks.

---

## 5. View submissions

Open the **Google Sheet** you created in step 1. Submissions appear in the
`Submissions` tab in real time, with this column layout:

```
Timestamp | Team Name | Team Size |
Leader Name | Leader ID | Leader Major | Leader Phone |
Member 2 Name | Member 2 ID | Member 2 Major | Member 2 Phone |
Member 3 Name | Member 3 ID | Member 3 Major | Member 3 Phone |
Language
```

For teams of 2, the Member 3 columns are blank.

---

## How duplicate prevention works

Before appending a row, the Apps Script checks whether the **Leader's
University ID** already exists in the sheet. If it does, the script returns
`{ success: false, error: "duplicate" }` and the UI shows:

- AR: `تم تسجيل هذا الفريق مسبقاً بنفس الرقم الجامعي للقائد.`
- EN: `This team is already registered with the same Leader University ID.`

This stops accidental double-submissions and discourages a single team
leader from registering multiple times. (Members can still be on multiple
teams — the dedupe key is the leader's ID only.)

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

The same validation runs server-side in `apps-script/Code.gs` so a
malicious client can't bypass it.

---

## Project structure

```
ieee-uop-registration/
├── apps-script/
│   └── Code.gs                  # Google Apps Script backend
├── public/
│   ├── ieee-logo.svg            # placeholder (replace with real PNG)
│   └── uop-logo.svg             # placeholder (replace with real PNG)
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── LanguageToggle.jsx
│   │   ├── Logo.jsx
│   │   ├── MemberForm.jsx
│   │   ├── StepIndicator.jsx
│   │   ├── SuccessScreen.jsx
│   │   └── TeamSizeSelector.jsx
│   ├── lib/
│   │   ├── api.js               # POST helper + error class
│   │   ├── i18n.js              # AR + EN strings, majors list
│   │   └── schema.js            # Zod schemas
│   ├── App.jsx                  # state, step routing, submit flow
│   ├── index.css                # Tailwind + fonts
│   └── main.jsx
├── .env.example
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## Troubleshooting

**"Apps Script URL is not configured"** — `.env` is empty or you forgot to
restart `npm run dev` after editing it.

**Submissions never reach the sheet** — open the Apps Script editor →
**Executions** (left rail) — failed requests show stack traces. Common
causes: deployment access is set to "Only myself" instead of "Anyone", or
the deployment is an older version that's missing `doPost`.

**CORS error in browser console** — Apps Script Web Apps allow cross-origin
POSTs *only* if you don't preflight. The frontend sends `Content-Type:
text/plain;charset=utf-8` (instead of `application/json`) specifically to
avoid triggering a CORS preflight. Don't change that header.

**Arabic font looks wrong** — make sure your browser isn't blocking
`fonts.googleapis.com`. The fallback chain (`Cairo → Tajawal → Segoe UI`)
keeps the page readable either way.

---

## License

Built for the IEEE Student Branch at the University of Petra. Use freely.
