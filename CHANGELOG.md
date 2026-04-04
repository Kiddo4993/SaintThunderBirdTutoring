# Saint Thunderbird Tutoring — Project Changes

This document summarizes structural refactors, bug fixes, and conventions applied to the frontend and server. Use it as a map for where files live and how URLs resolve.

---

## 1. Folder layout

| Location | Purpose |
|----------|---------|
| **`pages/`** | All static HTML pages (e.g. `index.html`, `login.html`, `student-dashboard.html`). |
| **`styles/`** | CSS: shared `style.css` plus one stylesheet per page that had inline `<style>` blocks. |
| **`scripts/`** | Browser JavaScript: shared modules (`auth.js`, `script.js`) and per-page modules (see below). |
| **Repo root** | `server.js`, `index.js`, `package.json`, API `routes/`, `services/`, `models/`, `favicon.svg`, etc. |

Test utilities remain under **`scripts/`** as `test-tutor-requests.js` and `test-integrations.js`.

---

## 2. URL resolution (Express)

- **`express.static('./')`** serves the project root: `/styles/...`, `/scripts/...`, `/auth` paths for APIs, etc.
- **`express.static('pages')`** is mounted so **site URLs stay flat**: e.g. `/login.html` serves `pages/login.html`, and `/` serves `pages/index.html` as the directory index.

Bookmarks and links like `href="login.html"` (same folder as other pages) continue to work without a `/pages/` prefix in the browser.

---

## 3. CSS modularization

- Global styles live in **`styles/style.css`** (formerly root `style.css`).
- Page-specific rules were moved out of HTML into matching files under **`styles/`**, for example:
  - `about.css`, `login.css`, `signup.css`, `loading.css`
  - `student-dashboard.css`, `student-profile.css`, `admin-applications.css`
  - `tutor-dashboard.css`, `tutor-pending.css`, `terms.css`, `volunteer-hours-guide.css`
- HTML in **`pages/`** links with **`../styles/...`**.

---

## 4. JavaScript modularization (`scripts/`)

### Shared

| File | Role |
|------|------|
| **`scripts/auth.js`** | Signup/login helpers, `AUTH_API_URL` for `/api/auth` (see naming note below). |
| **`scripts/script.js`** | Main site behavior (home and nav pages): theme toggle, music UI, info menu, etc. |
| **`scripts/script2.js`** | Present in repo; not required by current HTML (optional / legacy). |

### Per-page modules (loaded from `pages/*.html` via `../scripts/...`)

| File | Page(s) |
|------|-----------|
| `index-intro.js` | `index.html` (head: skip intro / redirect to loading) |
| `loading.js` | `loading.html` |
| `login.js` | `login.html` |
| `signup.js` | `signup.html` |
| `student-dashboard.js` | `student-dashboard.html` |
| `student-profile.js` | `student-profile.html` |
| `admin-applications.js` | `admin-applications.html` |
| `tutor-dashboard.js` | `tutor-dashboard.html` |

Inline `<script>` blocks were removed from those HTML files; interactive controls use **`addEventListener`** (and event delegation where lists are generated in JS) instead of HTML `onclick` / `onsubmit` on the refactored pages.

Nav pages that include **`scripts/script.js`** wire **theme** and **info** buttons from JS (`DOMContentLoaded`), not inline handlers in HTML.

---

## 5. Backend / deployment

### Entry point

- **`index.js`** at the project root only does `require('./server.js')` so hosts that run **`node index.js`** (e.g. Render) work even though the app is defined in **`server.js`**.

### Auth client global name

- In **`scripts/auth.js`**, the auth base URL is named **`AUTH_API_URL`** (not `API_URL`) so pages can define their own `const API_URL = '/api'` without a duplicate **`const`** error in the shared global scope of classic scripts.

---

## 6. Student dashboard fixes (behavior)

- **Duplicate `API_URL`:** Resolved by renaming auth’s constant to `AUTH_API_URL` (see above).
- **Wrong API for quick request modal:** Replaced non-existent **`POST /api/sessions/request`** with **`POST /api/tutor/create-request`**, with hour values mapped to `requestedTime` (`30min`, `1hour`, etc.).
- **Duplicate `id="requestModal"`:** The simple CTA overlay was renamed (e.g. **`quickInlineRequestModal`**) so the styled modal keeps a unique **`requestModal`** id for `openRequestModal` / `closeRequestModal`.
- **`submitRequest(event)`:** Guards **`event.preventDefault`** when `event` is missing.

---

## 7. Tutor dashboard script repair

- **`scripts/tutor-dashboard.js`** was rebuilt where the old inline block had been corrupted (merged strings / duplicate functions).
- Pending requests are loaded with **`GET /api/tutor/requests`**; acceptance uses **`POST /api/tutor/accept-request`** with `{ requestId }`, aligned with **`routes/tutor.js`**.
- Dynamic UI uses **`data-*` attributes** and delegated clicks instead of inline `onclick` in generated HTML where updated.

---

## 8. HTML asset paths from `pages/`

From any file under **`pages/`**:

- Styles: `../styles/<file>.css`
- Scripts: `../scripts/<file>.js`
- Favicon: `../favicon.svg`

---

## 9. Optional follow-ups (not done here)

- **`tutor-pending.html`** and **`terms.html`** may still use inline `<script>`; migrate to **`scripts/`** if you want full parity.
- **`script.js`** may still inject small `onclick` strings inside **template literals** for the info menu; refactoring that would be JS-only cleanup.

---

## 10. Next.js frontend (incremental migration) + Tailwind

### Layout

| Location | Purpose |
|----------|---------|
| **`web/`** | Next.js 15 App Router app (React 19). **`web/app/`** holds routes and global CSS. |
| **`web/components/home/`** | Home page: **`HomeClient`** (client shell), **`SiteNav`**, **`HomeContent`** (server markup), **`HomeEffects`** (interactivity ported from **`scripts/script.js`**). |
| **`web/lib/site-data.js`** | Popup and info-card copy shared with the legacy **`scripts/script.js`** data. |
| **`web/app/site-legacy.css`** | Snapshot of **`styles/style.css`** with a duplicate `*` / `body` block removed (avoids conflicting overrides mid-file). Imported from **`web/app/globals.css`** after Tailwind. |
| **`web/public/favicon.svg`** | Copy of repo-root **`favicon.svg`**. |

### Styling strategy

- **Tailwind CSS v4** is loaded via **`@import "tailwindcss"`** in **`web/app/globals.css`**. Layout and one-off spacing on the migrated home page use Tailwind utility classes where practical.
- Visual parity for the first migrated route relies on **legacy class names** (`.glass-card`, `.hero`, `.st-popup`, etc.) backed by **`site-legacy.css`**, so the migration stays incremental without re-specifying every effect in utilities immediately.

### Express API and legacy HTML during development

- **`server.js`** is unchanged: **`/api/*`**, static **`pages/*.html`**, **`styles/`**, and **`scripts/`** continue to be served from the Express app (default port **5000**).
- **`web/next.config.mjs`** can **rewrite** `/api/*`, `/styles/*`, `/scripts/*`, and listed **`*.html`** routes to a backend origin when **`BACKEND_ORIGIN`** (or **`NEXT_PUBLIC_BACKEND_ORIGIN`**) is set. Copy **`web/.env.example`** to **`web/.env.local`** and set e.g. `BACKEND_ORIGIN=http://127.0.0.1:5000` so **`npm run dev`** inside **`web/`** (port **3000**) can open legacy pages and hit the API from one browser origin.
- If **`BACKEND_ORIGIN`** is unset, rewrites are disabled; nav links to **`/login.html`** and similar resolve only on the Next origin or when you run Express separately.

### NPM scripts

| Command | Purpose |
|---------|---------|
| **`npm run dev --prefix web`** or **`npm run dev:web`** (repo root) | Next dev server. |
| **`npm run build --prefix web`** or **`npm run build:web`** | Production build of **`web/`**. |
| **`npm run test:web`** (repo root) | Runs **`web`** ESLint + **`next build`** (regression gate for the frontend). |

### Scope of this increment

- **Migrated:** marketing home page **`/`** in Next with behavior aligned to **`pages/index.html`** + **`scripts/script.js`** (theme, nav scroll, stars, counters, progress bars, reveal, popups, music panel, info menu / premium cards, scroll-to-top). The **`index-intro.js` → `loading.html`** redirect is **not** applied on the Next home route (avoids an extra redirect when developing **`/`** on port 3000).
- **Not migrated yet:** other **`pages/*.html`** and their **`scripts/*.js`** modules remain Express-only until moved into **`web/`**.

---

---

## 11. Full Next.js migration (complete)

All 15 pages have been migrated from Express-served static HTML to the **Next.js 15 App Router** in `web/`. The legacy `pages/`, `styles/`, and `scripts/` directories have been deleted.

### Migrated routes

| Next.js Route | Legacy File |
|---------------|-------------|
| `/` | `pages/index.html` |
| `/about` | `pages/about.html` |
| `/subjects` | `pages/subject.html` |
| `/students` | `pages/students.html` |
| `/mentors` | `pages/mentors.html` |
| `/login` | `pages/login.html` |
| `/signup` | `pages/signup.html` |
| `/loading` | `pages/loading.html` |
| `/terms` | `pages/terms.html` |
| `/tutor-pending` | `pages/tutor-pending.html` |
| `/volunteer-hours-guide` | `pages/volunteer-hours-guide.html` |
| `/student-dashboard` | `pages/student-dashboard.html` |
| `/student-profile` | `pages/student-profile.html` |
| `/tutor-dashboard` | `pages/tutor-dashboard.html` |
| `/admin-applications` | `pages/admin-applications.html` |

### Shared components

| Component | Purpose |
|-----------|---------|
| `web/components/MarketingShell.jsx` | Wrapper for marketing/info pages: renders `SiteNav` + `MarketingEffects` |
| `web/components/MarketingEffects.jsx` | Nav scroll effect and scroll-to-top button |
| `web/lib/api.js` | `getToken()`, `getUser()`, `apiFetch()` helpers for auth'd API calls |

### CSS strategy

- All page-specific CSS lives in **`web/app/globals.css`** (global scope, imported after Tailwind + `site-legacy.css`).
- Marketing pages are server components; auth/dashboard pages are `"use client"` with `localStorage`-based auth.

### server.js

- Removed the two `express.static` calls for `./` and `pages/`. **`server.js` is now API-only** (`/api/auth/*`, `/api/tutor/*`).

### next.config.mjs

- Removed legacy HTML/styles/scripts rewrites.
- Added **permanent redirects** from all `*.html` URLs to their Next.js equivalents (e.g. `/login.html` → `/login`).
- API rewrite (`/api/*` → `BACKEND_ORIGIN`) retained for development.

### Deleted

- `pages/` — all 15 static HTML files
- `styles/` — all CSS files (content merged into `web/app/globals.css`)
- `scripts/` — all browser JS modules (logic ported to React components)

*Last updated: full Next.js migration complete — Express is API-only, all frontend served by Next.js on Vercel.*

---

## 12. Backend migrated into Next.js (Express removed)

The Express backend (`server.js`, `index.js`, `routes/`, `models/`, `services/`, `jobs/`, `middleware/`) has been fully migrated into the Next.js app under `web/`. Express is no longer part of the project.

### New structure in `web/`

| Location | Purpose |
|----------|---------|
| `web/lib/db.js` | MongoDB singleton connection (serverless-safe) |
| `web/lib/authHelper.js` | `getAuthUser(request)` — JWT verification for API routes |
| `web/lib/models/User.js` | Mongoose User model |
| `web/lib/models/SystemSetting.js` | Mongoose SystemSetting model |
| `web/lib/services/emailService.js` | Nodemailer / Mailchimp transactional email |
| `web/lib/services/zoomService.js` | Zoom meeting creation (with fallback) |
| `web/lib/services/mailchimpService.js` | Mailchimp mailing list sync |
| `web/lib/jobs/biweeklyTutorSummary.js` | Biweekly tutor report generator |

### API routes (`web/app/api/`)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/signup` | POST | Register student or tutor applicant |
| `/api/auth/login` | POST | Login, returns JWT |
| `/api/auth/profile` | GET | Get current user profile |
| `/api/tutor/create-request` | POST | Student creates a tutoring request |
| `/api/tutor/my-requests` | GET | Student's own requests |
| `/api/tutor/available-tutors` | GET | List approved tutors |
| `/api/tutor/student-sessions` | GET | Student's sessions |
| `/api/tutor/student-stats` | GET | Student stats (requests, sessions, hours) |
| `/api/tutor/update-student-preferences` | POST | Save grade/interests |
| `/api/tutor/application-status` | GET | Tutor application status (for pending page) |
| `/api/tutor/requests` | GET | Open requests for a tutor |
| `/api/tutor/accept-request` | POST | Tutor accepts a request, creates session |
| `/api/tutor/sessions` | GET | Tutor's sessions |
| `/api/tutor/complete-session` | POST | Mark session as completed |
| `/api/tutor/stats` | GET | Tutor stats (sessions, hours) |
| `/api/tutor/update-specialties` | POST | Update tutor subjects |
| `/api/tutor/apply-tutor` | POST | Submit tutor application |
| `/api/tutor/approve/[userId]` | GET | Legacy email link — approve tutor |
| `/api/tutor/deny/[userId]` | GET | Legacy email link — deny tutor |
| `/api/tutor/pending-applications` | GET | Admin: list pending applications |
| `/api/tutor/admin-summary` | GET | Admin: dashboard counts |
| `/api/tutor/approve-tutor/[userId]` | POST | Admin: approve tutor |
| `/api/tutor/deny-tutor/[userId]` | POST | Admin: deny tutor |
| `/api/tutor/admin/send-biweekly-summary` | POST | Admin: trigger biweekly report |

### Dependencies added to `web/package.json`

- `mongoose` — MongoDB ODM
- `jsonwebtoken` — JWT signing/verification
- `bcryptjs` — password hashing
- `nodemailer` — transactional email

### Deleted from repo root

- `server.js`, `index.js` — Express entry points
- `routes/auth.js`, `routes/tutor.js`, `routes/sessions.js`, `routes/User.js`
- `models/User.js`, `models/SystemSetting.js`
- `services/emailService.js`, `services/zoomService.js`, `services/mailchimpService.js`
- `jobs/biweeklyTutorSummary.js`
- `middleware/auth.js`
- `test-request.js`, `user.json`

### next.config.mjs

- Removed the `BACKEND_ORIGIN` API rewrite — API calls are now handled in-process by Next.js.

### Notes

- The biweekly scheduler is no longer running via `setInterval`. Trigger it manually via `POST /api/tutor/admin/send-biweekly-summary`, or configure a Vercel Cron Job to call that endpoint on a schedule.
- The MongoDB singleton in `web/lib/db.js` reuses the connection across serverless invocations via `global.mongoose`.

*Last updated: backend fully migrated into Next.js — repo is now a single Next.js project.*
