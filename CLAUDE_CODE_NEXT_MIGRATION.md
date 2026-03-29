# Handoff: Finish Next.js migration and remove legacy static frontend

Use this document as the full context when continuing work in **Cursor / Claude Code**. The goal is to **migrate every page** from the Express-served static HTML stack into **`web/`** (Next.js 15 App Router + Tailwind v4), then **delete the obsolete files** and **simplify `server.js`** so Express only serves the **JSON API** (and any assets you explicitly keep at repo root).

---

## Current state (authoritative)

- **Backend:** `server.js` uses Express 5, MongoDB, `app.use(express.static(...))` for repo root + `pages/`, and mounts **`/api/auth`**, **`/api/tutor`** (see `routes/`).
- **Legacy frontend:** `pages/*.html`, `styles/*.css`, `scripts/*.js` (plus shared `scripts/auth.js`). URLs are flat (e.g. `/login.html`) because `express.static('pages')` maps them to the site root.
- **Next app:** `web/` — Next 15, React 19, Tailwind 4. **`web/app/page.js`** is the **only** migrated route so far (home `/`). It uses:
  - `web/components/home/*` (nav, content, effects)
  - `web/lib/site-data.js` (popup + info card copy)
  - `web/app/globals.css` → `@import "tailwindcss"` then `web/app/site-legacy.css` (trimmed copy of `styles/style.css`)
- **Dev proxy (optional):** `web/next.config.mjs` rewrites `/api/*`, `/styles/*`, `/scripts/*`, and listed `*.html` to **`BACKEND_ORIGIN`** when set (see `web/.env.example`). This lets `next dev` on port 3000 talk to Express on 5000 during migration.

---

## Target architecture

1. **All user-facing UI** lives under **`web/`** (Next). Prefer **App Router** routes like `web/app/about/page.js` instead of `.html` URLs.
2. **Express** exposes only **`/api/*`** (and health checks if needed). Remove static file serving for `pages/`, `./` HTML/CSS/JS once nothing depends on it.
3. **Tailwind:** Replace `site-legacy.css` over time with utilities + small `globals.css` layers. Delete per-page CSS under `styles/` when each page is migrated.
4. **Auth / API calls:** Preserve behavior from `scripts/auth.js` (note **`AUTH_API_URL`** vs page-level `API_URL` naming). Use `fetch` to **`/api/...`** from Next (same origin if Next and API are deployed behind one host, or configure `NEXT_PUBLIC_*` base URL).

---

## Pages still to migrate (legacy → suggested Next routes)

| Legacy file | Suggested route | Primary script(s) | Primary CSS |
|-------------|-------------------|---------------------|-------------|
| `pages/index.html` | `/` | Done in Next (`HomeEffects` replaces `script.js` home parts) | `style.css` (via `site-legacy.css`) |
| `pages/about.html` | `/about` | `script.js` (nav/theme/info) | `about.css` + `style.css` |
| `pages/mentors.html` | `/mentors` | `script.js` | `style.css` |
| `pages/students.html` | `/students` | `script.js` | `style.css` |
| `pages/subject.html` | `/subject` or `/subjects` | `script.js` | `style.css` |
| `pages/login.html` | `/login` | `login.js`, `auth.js` | `login.css` + `style.css` |
| `pages/signup.html` | `/signup` | `signup.js`, `auth.js` | `signup.css` + `style.css` |
| `pages/loading.html` | `/loading` or fold into root flow | `loading.js` | `loading.css` |
| `pages/student-dashboard.html` | `/student-dashboard` | `student-dashboard.js`, `auth.js` | `student-dashboard.css` + `style.css` |
| `pages/student-profile.html` | `/student-profile` | `student-profile.js` | `student-profile.css` + `style.css` |
| `pages/tutor-dashboard.html` | `/tutor-dashboard` | `tutor-dashboard.js` | `tutor-dashboard.css` + `style.css` |
| `pages/tutor-pending.html` | `/tutor-pending` | (inline or new module) | `tutor-pending.css` |
| `pages/admin-applications.html` | `/admin-applications` | `admin-applications.js` | `admin-applications.css` + `style.css` |
| `pages/volunteer-hours-guide.html` | `/volunteer-hours-guide` | varies | `volunteer-hours-guide.css` |
| `pages/terms.html` | `/terms` | (inline or new module) | `terms.css` |

**Shared:** `scripts/script.js` — large; home-specific pieces are already mirrored in `HomeEffects.jsx`. Other pages may still import shared behavior; factor shared nav/theme/info into **`web/components`** (e.g. `SiteShell`, `ThemeProvider`) instead of copying `script.js` wholesale.

**Tests / tooling (do not treat as user pages):** `scripts/test-tutor-requests.js`, `scripts/test-integrations.js` — keep or move to `web/` scripts / CI; do not block deletion of static HTML.

---

## Recommended migration order

1. **Layouts:** Extract a shared **layout** (nav, footer, theme, fonts) matching `layout.js` + `SiteNav` patterns.
2. **Public marketing:** `about`, `subject(s)`, `students`, `mentors`, `terms`, `volunteer-hours-guide` (mostly static + `script.js` behaviors).
3. **Auth:** `login`, `signup`, `loading` — wire cookies/tokens consistently with `routes/auth.js`.
4. **Dashboards:** `student-dashboard`, `tutor-dashboard`, `student-profile`, `admin-applications`, `tutor-pending` — heavy JS; convert to client components + `fetch` to existing APIs (`routes/tutor.js`, etc.).

After each page: run **`npm run test:web`** (lint + build) and manually smoke-test flows that hit the API.

---

## When everything is migrated: deletion checklist

**Only delete after** Next has equivalent routes, links use Next `Link`/`href` (no `.html`), and production deployment plan is updated.

### Safe to remove (frontend legacy)

- **`pages/`** entire directory (all `.html`).
- **`styles/`** — if no file is imported by Express or tooling after static removal; start with per-page CSS already replaced, then **`style.css`** / **`site-legacy.css`** shrink or delete.
- **`scripts/`** — page bundles (`login.js`, `signup.js`, …) and **`script.js`** once unused. **Keep or relocate:** `auth.js` logic as TS/JS modules under `web/lib/` until behavior is duplicated there.
- **Root static** only if nothing references: e.g. duplicate `favicon` (Next uses `web/public/favicon.svg`).

### Server changes (`server.js`)

- Remove `express.static` for `./` and `pages/` (or restrict to a single `public` folder if you keep non-Next assets).
- Ensure CORS / JSON body / routes unchanged for `/api/*`.
- Update **`CHANGELOG.md`** and deployment docs (Render, etc.) with “API-only Express + Next frontend.”

### Next config

- Remove **`rewrites()`** in `web/next.config.mjs` that proxy to `BACKEND_ORIGIN` **if** production serves Next and API under one reverse proxy with `/api` to Express; keep env-based API base URL for client `fetch` instead.

### Misc

- Delete **`index-intro.js` → `loading.html`** redirect behavior if you replace with a Next middleware or a single loading route.
- **`script2.js`:** remove if confirmed unused.

---

## Verification before “delete everything”

- [ ] `cd web && npm run test` (lint + build) passes.
- [ ] All routes reachable without `.html` (add **`redirects`** in `next.config.mjs` from old `.html` URLs if you need backward compatibility temporarily).
- [ ] Auth flows: login, signup, token storage, protected dashboards.
- [ ] Tutor/student API flows still match `routes/tutor.js` / `routes/auth.js` contracts.
- [ ] No remaining imports or links to `/pages/`, `/scripts/`, `/styles/` from README, CI, or env.

---

## Commands reference

```bash
# Legacy API + static (today)
npm run dev          # or: node server.js

# Next app
npm run dev:web      # from repo root
npm run test:web     # lint + production build of web/
```

---

## Constraints for the implementing agent

- **Do not** delete `pages/`, `styles/`, or `scripts/` until each consumer is migrated and tested.
- **Do** preserve API behavior and env vars (`MONGODB_URI`, JWT secrets, etc.).
- **Prefer** small PR-sized steps: migrate one route, update internal links, run `test:web`, then delete that page’s legacy assets.
- **Update `CHANGELOG.md`** when static serving is removed and the repo layout changes.

---

*Generated for handoff: finish Next migration, then delete legacy static frontend and slim Express to API-only.*
