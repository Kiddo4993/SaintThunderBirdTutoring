# SAINT THUNDERBIRD TUTORING
## Full Code Audit — Bugs, Fixes & Feature Roadmap
**Version 2.0 — Updated March 2026 | Based on Live Code Review**

---

## 1. Files Reviewed

| File | Type | What It Does |
|------|------|--------------|
| `routes/auth.js` (backend) | Node/Express Route | Signup, login, JWT token generation |
| `auth.js` (frontend) | Browser JS | Client-side login routing, localStorage, redirects |
| `routes/tutor.js` | Node/Express Route | All tutor/student API endpoints, session accept, stats |
| `routes/sessions.js` | Node/Express Route | Session request creation and pending fetch |
| `models/User.js` | Mongoose Schema | All user data: requests, sessions, tutorApplication |
| `models/Request.js` | Mongoose Schema | Standalone Request model (largely unused) |
| `models/Session.js` | Mongoose Schema | Standalone Session model (largely unused) |
| `tutor-dashboard.html` | Frontend HTML/JS | Tutor dashboard UI, stats, request list |
| `student-dashboard.html` | Frontend HTML/JS | Student dashboard UI, stats, request form |

---

## 2. Critical Bugs Found in Code

> ⚠️ These bugs were found directly in your code files. Each one includes the exact file name and line number.

---

### BUG #1 — Tutor Signup Saves `userType` as `'student'` (THE ROOT CAUSE)
**File:** `routes/auth.js` (backend) | **Line 191**

This is the single root cause of almost all your login/routing problems. When a tutor signs up, the backend deliberately saves them as `userType: 'student'` in MongoDB. This means their account looks like a student account to any code that checks `userType`.

```js
// LINE 191 — BUG
const actualUserType = userType === 'tutor' ? 'student' : userType;
```

**Why this causes problems:**
- The login function checks `user.userType === 'student'` and sends approved tutors to the student dashboard instead of the tutor dashboard
- The tutor dashboard route check fails because the DB says `'student'` even after approval
- The requests API at `/api/tutor/requests` checks `userType === 'tutor'` — pending tutors (saved as `'student'`) see no requests
- The approve-tutor route does flip `userType` to `'tutor'` correctly — but the frontend JWT token from login is cached with the OLD `'student'` userType, so the UI still thinks they are a student until they log out and back in

#### ✅ The Fix:
**Option A (Recommended):** Store tutors as `userType: 'tutor'` from signup. Control access with `tutorApplication.status` only.

```js
// routes/auth.js line 191 — CHANGE TO:
const actualUserType = userType; // Keep tutor as 'tutor' from the start
```

**Option B:** Keep current approach but force a fresh token refresh on every login (the tutor dashboard already does this — but the login redirect happens before the refresh completes).

---

### BUG #2 — Tutor Dashboard Access Not Blocked for Pending/Denied Tutors
**File:** `tutor-dashboard.html` | **Lines 461–466**

```js
if (user.userType !== 'tutor' && user.email !== 'dylanduancanada@gmail.com') {
    const appStatus = user.tutorApplication?.status;
    if (appStatus === 'pending') {
        window.location.href = 'tutor-pending.html'; // ← Only redirects pending
    }
    // ← MISSING: no redirect for 'denied' or undefined status!
}
```

**Problems:**
- If `appStatus` is `'denied'` — the code does nothing, user stays on the tutor dashboard
- If `appStatus` is `undefined`/`null` — the code does nothing, user stays on the tutor dashboard
- Because of Bug #1, `user.userType` is `'student'` even for pending tutors, so the outer `if` check passes and they get into the dashboard

#### ✅ The Fix:
```js
// tutor-dashboard.html — replace the guard block with:
if (user.email !== 'dylanduancanada@gmail.com') {
    const appStatus = user.tutorApplication?.status;
    if (appStatus !== 'approved' && user.userType !== 'tutor') {
        if (appStatus === 'pending') {
            window.location.href = 'tutor-pending.html';
        } else {
            window.location.href = 'login.html'; // denied or no application
        }
        return;
    }
}
```

---

### BUG #3 — Student Dashboard Sends Request to Wrong API Endpoint
**File:** `student-dashboard.html` | **Line 754** vs **Lines 1310 & 1399**

There are **two different request forms** on the student dashboard sending to **two different API endpoints**. Only one of them works correctly.

```js
// Line 754 — WRONG endpoint (uses Session model, duration/subject not saved correctly):
const res = await fetch('/api/sessions/request', { ... })

// Lines 1310 & 1399 — CORRECT endpoint (saves duration, notifies tutors):
const res = await fetch('/api/tutor/create-request', { ... })
```

The `/api/sessions/request` endpoint saves to the `Session` collection. The tutor dashboard reads from `User.tutorRequests`. So requests submitted via the wrong endpoint are **invisible to tutors**.

- The quick "Request Help" button at Line 754 uses `/api/sessions/request` — **WRONG**
- The full modal form uses `/api/tutor/create-request` — **CORRECT**

#### ✅ The Fix:
```js
// student-dashboard.html line 754 — change to:
const res = await fetch('/api/tutor/create-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ subject, hours, description: '', priority: 'medium', requestedTime: hours })
});
```

---

### BUG #4 — Tutor Dashboard Fetches Requests from Wrong Endpoint
**File:** `tutor-dashboard.html` | **Line 544**

```js
// Line 544 — WRONG endpoint:
const res = await fetch(`${API_URL}/sessions/pending`, { ... })

// Should be:
const res = await fetch(`${API_URL}/tutor/requests`, { ... })
```

The `/api/sessions/pending` endpoint returns from the `Session` model collection. But requests created via `/api/tutor/create-request` are stored inside `User.tutorRequests`. The tutor dashboard fetches from the wrong place — so it always shows empty even when real requests exist in MongoDB.

#### ✅ The Fix:
```js
// tutor-dashboard.html line 544 — change to:
const res = await fetch(`${API_URL}/tutor/requests`, {
    headers: { 'Authorization': `Bearer ${tokenToUse}` }
});
```

---

### BUG #5 — Signup Returns No Token (Student Can't Auto-Login to Dashboard)
**File:** `routes/auth.js` (backend) | **Lines 233–238**

```js
// Lines 233-238 — Signup returns NO token:
res.status(201).json({
    success: true,
    message: '...',
    user: createAuthUserPayload(user)  // No token!
});
```

The frontend `signupStudent()` function expects `data.token` to store in localStorage and redirect to `student-dashboard.html`. But the server returns no token on signup. So:

1. Student signs up — no token is saved to localStorage
2. Student is redirected to `student-dashboard.html`
3. Student dashboard checks for token — finds nothing — redirects back to `login.html`
4. Student is confused — they just signed up but end up at the login page

#### ✅ The Fix — Pick One:

**Option A:** Generate and return a token on signup (seamless auto-login):
```js
// routes/auth.js — add token to signup response:
const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);
res.status(201).json({ success: true, token, user: createAuthUserPayload(user) });
```

**Option B:** Update frontend to show a message and redirect to login instead:
```js
// client auth.js signupStudent():
if (data.success) {
    alert('Account created! Check your email for your login details.');
    window.location.href = 'login.html'; // Not student-dashboard.html
}
```

---

### BUG #6 — Two Conflicting `User.js` Model Files
**Files:** `models/User.js` (two versions uploaded)

Two different versions of `User.js` were found. If the wrong file is being used by the server, critical fields won't be saved to MongoDB.

| Field | Version 1 (Full) | Version 2 (Simple) | Impact if Wrong Version Used |
|-------|------------------|--------------------|------------------------------|
| `studentSessions` | ✅ Present | ❌ Missing | Student session history won't save |
| `interests` | ✅ Present | ❌ Missing | Student subject preferences lost |
| `availableTimes` | ✅ Present | ❌ Missing | Tutor time slots won't save |
| Password hashing | Done in route | Pre-save hook | Could cause double-hashing bug |
| `userType` enum | student/tutor/admin | student/tutor only | Admin type not allowed in DB |

#### ✅ The Fix:
Make sure only the **full version** of `User.js` (Version 1) is used. Check `server.js` to confirm which path is required. Delete or rename the simple version.

---

### BUG #7 — Dashboard Stat Boxes Show 0 (MongoDB Data Not Displaying)
**Files:** `tutor-dashboard.html` (Line 516), `student-dashboard.html` (Line 990)

The stat boxes on both dashboards always show `0` because:

- Tutor stats endpoint `/api/tutor/stats` checks `userType === 'tutor'` — but because of Bug #1, userType is `'student'` and the server rejects with `403 Forbidden` before touching MongoDB
- Student stats endpoint `/api/tutor/student-stats` also checks `userType === 'student'` — stale localStorage data can cause this to fail silently
- If requests were submitted to the wrong endpoint (Bug #3), `requestsMade` will always be `0`
- Sessions completed will be `0` if the tutor completing sessions never updated the student's `studentSessions` array

#### ✅ The Fix:
Fix Bugs #1 and #3 first — the stat boxes should then populate correctly. Also add `console.error` logging to all stat fetch functions to catch any remaining `403` errors.

---

### BUG #8 — Deny Route Deletes Entire `tutorApplication` (Breaks Login Logic)
**File:** `routes/tutor.js` | Old GET deny route

```js
// OLD deny route — DELETES the entire tutorApplication from MongoDB:
await User.findByIdAndUpdate(userId, { $unset: { tutorApplication: 1 } });
```

The login function checks `user.tutorApplication?.status`. If the application is completely deleted:
- `appStatus` becomes `undefined`
- Login sends the denied tutor to `student-dashboard.html` (the fallback path)
- There are **two deny routes** doing different things — this is inconsistent

The correct POST `/deny-tutor/:userId` route properly sets `status: 'denied'` — the old GET route should be removed.

#### ✅ The Fix:
Remove the old GET `/deny/:userId` route. Use only the POST `/deny-tutor/:userId` route. Update approval email links to point to the POST routes.

---

## 3. Feature Status — What's Built vs What's Missing

| Feature You Described | Status | Notes |
|-----------------------|--------|-------|
| Student signs up → goes to dashboard | ❌ BROKEN | No token returned on signup (Bug #5) — redirected to login.html |
| Tutor signs up → goes to pending page | ⚠️ PARTIAL | Redirect code exists, but no token so pending page may not load |
| Both signups send email to dylanduancanada@gmail.com | ✅ WORKING | Both signup flows send to `ADMIN_EMAIL` correctly |
| Admin gets approve/deny email for tutor | ✅ WORKING | Email sent with buttons — but links use GET routes, not POST |
| Approval required before tutor can access dashboard | ❌ BROKEN | Dashboard guard missing redirect for denied status (Bug #2) |
| Tutor and student have separate dashboards | ⚠️ PARTIAL | Separate HTML files exist, but routing sends wrong users to wrong pages |
| Request shows duration to tutor | ✅ WORKING | `requestedTime` saved and displayed — but tutor fetches wrong endpoint (Bug #4) |
| Accepted request goes to history on both sides | ⚠️ PARTIAL | Code saves to `studentSessions` + `tutorSessions`, but student sees nothing (endpoint mismatch) |
| Zoom link sent to tutor and student on accept | ✅ WORKING | `zoomService.createSessionMeeting()` called on accept, with email fallback |
| Subjects from signup are the only subjects shown | ❌ NOT BUILT | Subjects saved but dashboards don't filter by them |
| Tutor/student can change subjects from sidebar | ⚠️ PARTIAL | API routes exist for both, but no sidebar UI is built yet |

---

## 4. Missing Features — Code Changes Needed

### 4.1 Subject Filtering — Signup Subjects Lock In What You See

**What you want:** Tutors who signed up for Math and Science only see Math/Science requests. Students who signed up for Math only see Math tutors.

**What exists:**
- Tutor subjects are saved to `tutorApplication.subjects` and `tutorProfile.subjects` at signup ✅
- Student interests/subjects are **NOT** saved at signup — field exists in model but signup form doesn't collect them ❌
- `/api/tutor/requests` already filters by tutor's subjects ✅
- Student dashboard subject dropdown loads from all tutors' subjects, not the student's chosen subjects ❌

**What needs to be added:**

1. Student signup form must collect subject preferences and send as `interests: [...]`
2. Save interests in `routes/auth.js`:
```js
// routes/auth.js — add to student userData:
interests: Array.isArray(req.body.interests) ? req.body.interests : []
```
3. Filter student request modal to only show their interests:
```js
// student-dashboard.html:
const user = JSON.parse(localStorage.getItem('user'));
const mySubjects = user.interests || [];
// Only show options from mySubjects, not all tutor subjects
```
4. Add a "Change My Subjects" section in the student sidebar calling a new endpoint

---

### 4.2 Request History Section at Bottom of Dashboards

**What you want:** Once accepted, requests appear in a history section at the bottom of both dashboards with the Zoom link.

**What exists:**
- `accept-request` route correctly saves to `tutorSessions` and `studentSessions` ✅
- `/api/tutor/sessions` endpoint returns tutor sessions — tutor dashboard calls this ✅
- `/api/tutor/student-sessions` endpoint exists ✅
- Student dashboard does **NOT** render student sessions in a visible history section ❌

**What needs to be added:**
- Student dashboard needs a **"Session History"** section below the requests list
- It should call `/api/tutor/student-sessions` and show: tutor name, subject, duration, scheduled time, Zoom link button, status badge
- Tutor dashboard session history exists but Zoom link is not shown as a clickable button

---

### 4.3 Zoom Link Display in Dashboard

**What exists:**
- Zoom link is emailed to both parties on accept ✅
- Zoom link is stored in `tutorSessions` and `studentSessions` in MongoDB ✅
- Zoom link is **NOT** displayed as a clickable button in either dashboard ❌

**What needs to be added:**
```js
// In session card HTML:
${session.zoomLink
  ? `<a href="${session.zoomLink}" target="_blank" class="btn-zoom">🎥 Join Zoom</a>`
  : '<span>Zoom link will be emailed to you</span>'
}
```

---

### 4.4 Sidebar Subject Change (Students and Tutors)

**What exists:**
- `POST /api/tutor/update-specialties` route exists for tutors ✅
- `POST /api/tutor/update-student-preferences` route exists for students ✅
- No sidebar UI is built in either dashboard ❌

**What needs to be added:**
- Collapsible sidebar panel on tutor dashboard with subject checkboxes → calls `/api/tutor/update-specialties`
- Collapsible sidebar panel on student dashboard with subject checkboxes → calls `/api/tutor/update-student-preferences`
- After saving, refresh requests/tutors list so new filter takes effect immediately

---

## 5. Priority Fix Checklist

Work through these **in order**. Bugs #1–5 are blocking everything else.

| # | Bug / Fix | File | Priority | Status |
|---|-----------|------|----------|--------|
| 1 | Fix `actualUserType` — store tutors as `'tutor'` from signup | `routes/auth.js` line 191 | 🔴 CRITICAL | To Do |
| 2 | Fix dashboard guard — redirect denied/undefined tutors | `tutor-dashboard.html` lines 461–466 | 🔴 CRITICAL | To Do |
| 3 | Fix student request form — use `/api/tutor/create-request` | `student-dashboard.html` line 754 | 🔴 CRITICAL | To Do |
| 4 | Fix tutor request fetch — use `/api/tutor/requests` | `tutor-dashboard.html` line 544 | 🔴 CRITICAL | To Do |
| 5 | Fix signup — return token OR redirect to login.html | `routes/auth.js` lines 233–238 | 🔴 CRITICAL | To Do |
| 6 | Remove old `User.js` (simple version) — use full schema only | `models/User.js` | 🟠 HIGH | To Do |
| 7 | Remove old GET `/deny/:userId` route, use POST only | `routes/tutor.js` | 🟠 HIGH | To Do |
| 8 | Add Zoom join button to tutor session history cards | `tutor-dashboard.html` | 🟠 HIGH | To Do |
| 9 | Build student session history section with Zoom link | `student-dashboard.html` | 🟠 HIGH | To Do |
| 10 | Save student interests at signup | `routes/auth.js` + signup form | 🟠 HIGH | To Do |
| 11 | Filter student request subjects to their interests | `student-dashboard.html` | 🟡 MEDIUM | To Do |
| 12 | Build tutor subject sidebar (calls `update-specialties`) | `tutor-dashboard.html` | 🟡 MEDIUM | To Do |
| 13 | Build student subject sidebar (calls `update-student-preferences`) | `student-dashboard.html` | 🟡 MEDIUM | To Do |
| 14 | Add error logging to all stat fetch functions | Both dashboards | 🟡 MEDIUM | To Do |
| 15 | Update approval email links to use POST routes | `routes/auth.js` `handleTutorSignupFlow` | 🟡 MEDIUM | To Do |

---

## 6. Original General Audit (From Version 1.0)

> Items below are from the first audit and are still relevant.

### 6.1 Security — Still Check These
- Ensure `.env` file is in `.gitignore` and **never** committed to GitHub
- `JWT_SECRET`, `MONGO_URI`, and email credentials must only exist in `.env`
- The admin check in `tutor.js` uses `email === ADMIN_EMAIL` — this is fine as long as `ADMIN_EMAIL` is loaded from `.env` and not hardcoded
- The GET `/approve/:userId` and GET `/deny/:userId` routes have **no authentication** — anyone with the URL can approve or deny tutors. These should require admin auth middleware.

### 6.2 Performance & UX
- Images on all pages should be compressed to WebP format under 200KB
- All forms should disable the submit button while the API call is in progress to prevent duplicate submissions
- Mobile responsiveness needs testing — dashboard tables likely overflow on small screens

### 6.3 Future Feature Roadmap (Phases 2 & 3)

| Feature | Priority | Notes |
|---------|----------|-------|
| Volunteer certificate PDF generator | Phase 2 | Auto-generate at milestone hours (10, 25, 50) |
| Newsletter system with archive | Phase 2 | Admin composes newsletters, public archive page |
| Student progress tracking | Phase 2 | Tutor records session notes after each lesson |
| Resource library | Phase 3 | Admins upload PDFs/worksheets organized by subject |
| Indigenous language support | Phase 3 | Cree, Ojibwe, Michif language toggle |
| Google Calendar integration | Phase 3 | Sessions auto-added to calendar on accept |
| Volunteer hour reporting export | Phase 2 | CSV/PDF download for grant reporting |

---

## 7. Summary

> **Fix Bugs #1 through #5 first.** These 5 bugs are connected — Bug #1 (wrong `userType` saved) causes Bug #2 (dashboard bypass), which makes Bug #4 (wrong endpoint) invisible, which causes stats to show 0. Fix them in order and most of the site will start working correctly.

---

*End of Report v2.0 — Saint Thunderbird Tutoring Platform*