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

*Last updated to reflect the modular `pages/`, `styles/`, and `scripts/` layout and related server behavior.*
