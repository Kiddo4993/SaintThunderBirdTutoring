# Bugs and Fixes - Saint Thunderbird Tutoring Platform

This document tracks all bugs found in the application and their fixes, including findings from the v2 code audit (March 2026).

---

## Audit v2 Findings (March 2026)

### Bug A1 — Tutor Signup Saves userType as 'student' (CRITICAL) ✅ FIXED

**File:** `web/app/api/auth/signup/route.js`

**Problem:** The signup route deliberately saved tutors as `userType: 'student'` in MongoDB. This caused a cascade of failures: approved tutors were redirected to the student dashboard, the tutor request API returned 403 for pending tutors, and JWT tokens cached the wrong userType.

**Root cause line:**
```js
// BEFORE (bug)
const actualUserType = userType === 'tutor' ? 'student' : userType;
```

**Fix applied:**
```js
// AFTER
const actualUserType = userType;
```

**Impact:** Tutors now stored as `userType: 'tutor'` from signup. Access control uses `tutorApplication.status` instead.

---

### Bug A2 — Tutor Dashboard Guard Doesn't Block Pending/Denied Tutors (CRITICAL) ✅ FIXED

**File:** `web/app/tutor-dashboard/page.js`

**Problem:** After fixing Bug A1, tutors with `userType: 'tutor'` and `status: 'pending'` would bypass the dashboard guard entirely (the guard only checked `userType !== "tutor"`). Additionally, denied tutors had no explicit redirect to a meaningful page.

**Fix applied:** Guard now checks both `userType` and `tutorApplication.status`:
```js
if (u.email !== ADMIN_EMAIL) {
  if (u.userType !== "tutor") {
    router.push("/login"); return;
  }
  const appStatus = u.tutorApplication?.status;
  if (appStatus !== "approved") {
    router.push(appStatus === "pending" ? "/tutor-pending" : "/login");
    return;
  }
}
```

This correctly routes:
- Non-tutors → `/login`
- Pending tutors → `/tutor-pending`
- Denied tutors → `/login`
- Approved tutors → dashboard (allowed through)

---

### Bug A3 — Student Dashboard Sends Request to Wrong API Endpoint (CRITICAL) ✅ ALREADY FIXED

**Status:** Already corrected during Next.js migration. Both the quick modal and full request modal use `/api/tutor/create-request`.

---

### Bug A4 — Tutor Dashboard Fetches Requests from Wrong Endpoint (CRITICAL) ✅ ALREADY FIXED

**Status:** Already corrected during Next.js migration. Tutor dashboard uses `/api/tutor/requests`.

---

### Bug A5 — Signup Returns No Token (CRITICAL) ✅ ALREADY FIXED

**Status:** Already corrected during Next.js migration. Signup route generates and returns a JWT token.

---

### Bug A6 — Two Conflicting User.js Model Files (HIGH) ✅ ALREADY FIXED

**Status:** Only one model file exists at `web/lib/models/User.js` with the full schema. Added missing `deniedAt: Date`, `denialReason: String`, and `requestedType: String` fields to the `tutorApplication` sub-schema so deny routes save correctly.

---

### Bug A7 — Dashboard Stat Boxes Show 0 (HIGH) ✅ PARTIALLY FIXED

**Status:** The Next.js stats routes do not perform a userType check that would return 403 (unlike the old Express backend). Stats will populate correctly once Bug A1 is resolved and tutors are stored with the correct userType. Error logging added to all stat fetch functions in both dashboards so failures appear in the browser console.

---

### Bug A8 — Deny Route Deletes Entire tutorApplication (HIGH) ✅ FIXED

**File:** `web/app/api/tutor/deny/[userId]/route.js`

**Problem:** The legacy GET deny route (used in admin email links) called `$unset: { tutorApplication: 1 }`, which deleted the entire tutorApplication object from MongoDB. This meant denied tutors had no `status` field, causing login logic to fall through to incorrect redirects.

**Fix applied:** Changed to set `status: 'denied'` instead of unsetting the whole object:
```js
// BEFORE (bug)
await User.findByIdAndUpdate(userId, { $unset: { tutorApplication: 1 } });

// AFTER
await User.findByIdAndUpdate(userId, {
    $set: { 'tutorApplication.status': 'denied', 'tutorApplication.deniedAt': new Date() }
});
```

The POST deny route at `/api/tutor/deny-tutor/[userId]` already handled this correctly and was unchanged.

---

## Remaining TODOs (From Audit v2)

These items are not yet implemented. Ordered by priority.

### HIGH Priority

| # | Task | File(s) |
|---|------|---------|
| 1 | Save student `interests` at signup — signup form must collect subject preferences and pass `interests: [...]` to the backend | `web/app/signup/page.js`, `web/app/api/auth/signup/route.js` |
| 2 | Add Zoom join button to tutor session history cards (already in tutor dashboard — verify it renders clickably for all session types) | `web/app/tutor-dashboard/page.js` |

### MEDIUM Priority

| # | Task | File(s) |
|---|------|---------|
| 3 | Filter student request subject dropdown to only show the student's saved `interests` | `web/app/student-dashboard/page.js` |
| 4 | Build tutor subject sidebar — checkboxes calling `POST /api/tutor/update-specialties` | `web/app/tutor-dashboard/page.js` |
| 5 | Build student subject sidebar — checkboxes calling `POST /api/tutor/update-student-preferences` | `web/app/student-dashboard/page.js` |
| 6 | Update admin approval email links to use POST routes instead of GET (security: unauthenticated GET routes can be triggered by anyone with the URL) | `web/app/api/auth/signup/route.js` (email builder), `web/app/api/tutor/approve/[userId]/route.js`, `web/app/api/tutor/deny/[userId]/route.js` |

### LOW / Future (Phase 2–3)

| # | Feature | Notes |
|---|---------|-------|
| 7 | Volunteer certificate PDF generator | Auto-generate after 10, 25, 50 hours |
| 8 | Newsletter system with archive | Admin composes, public archive page |
| 9 | Student progress tracking | Tutor records notes after each session |
| 10 | Resource library | Admin uploads PDFs/worksheets by subject |
| 11 | Indigenous language support | Cree, Ojibwe, Michif language toggle |
| 12 | Google Calendar integration | Sessions auto-added to calendar on accept |
| 13 | Volunteer hour reporting export | CSV/PDF download for grant reporting |

---

## Original v1 Audit Findings (2026-02-02)

### Bug #1: Tutor Auto-Approval Security Issue ✅ SUPERSEDED

**See Bug A1 above.** The original v1 fix kept tutors as `userType: 'student'`. The v2 audit identified this as the root cause of multiple bugs. Reverted: tutors are now stored as `userType: 'tutor'` from signup and access is gated by `tutorApplication.status`.

---

### Bug #2: Login Flow Doesn't Handle Pending Tutors ✅ FIXED

Handled by the tutor dashboard guard (Bug A2) and the tutor-pending page profile re-fetch.

---

### Bug #3: Zoom Meeting Links Are Placeholder/Fake ✅ ACCEPTED

Zoom links are generated via `zoomService.createSessionMeeting()` with fallback to a manual placeholder. Email instructions tell both parties to coordinate. Zoom API integration is a Phase 2 item.

---

### Bug #4: Profile Data Not Persisting ✅ FIXED

`tutorProfile` is saved correctly at signup and returned in the auth payload.

---

### Bug #5: Hardcoded API URLs ✅ FIXED

All API calls use relative paths. No production URLs hardcoded in client code.

---

## Security Notes

- `.env` must be in `.gitignore` — never commit `JWT_SECRET`, `MONGO_URI`, or email credentials
- The GET `/api/tutor/approve/[userId]` and GET `/api/tutor/deny/[userId]` routes are unauthenticated — anyone with the URL can trigger them. These are legacy email links. For production, consider replacing with signed time-limited tokens or requiring admin session auth.
- Admin identity check uses `email === ADMIN_EMAIL` where `ADMIN_EMAIL` is from environment — this is acceptable as long as `.env` is secure

---

## Configuration Requirements

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT token signing secret |
| `EMAIL_USER` | Gmail address for Nodemailer |
| `EMAIL_PASSWORD` | Gmail App Password |
| `ADMIN_EMAIL` | Admin email for tutor approval notifications |

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-02 | 1.1.0 | Fixed tutor approval flow, improved Zoom UX, added documentation |
| 2026-02-02 | 1.1.1 | Fixed hardcoded URLs, added email notifications for admin panel actions |
| 2026-04-04 | 2.0.0 | Full Next.js + backend migration. Fixed Bugs A3, A4, A5, A6. |
| 2026-04-04 | 2.1.0 | Fixed Bugs A1 (userType), A2 (dashboard guard), A8 (deny route). Added error logging. |
