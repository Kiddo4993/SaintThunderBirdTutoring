# Bugs and Fixes - Saint Thunderbird Tutoring Platform

This document tracks all bugs found in the application and their fixes.

---

## Bug #1: Tutor Auto-Approval Security Issue (CRITICAL)

### Description
When a user signs up as a tutor, they are immediately assigned `userType: 'tutor'` even though their application status is set to `'pending'`. This creates a security vulnerability where unapproved tutors could potentially access tutor-only features.

### Affected Files
- `routes/auth.js` (line 41)
- `login.html`

### Root Cause
In `routes/auth.js`, the signup endpoint sets:
```javascript
userType: userType // If 'tutor' is passed, it's set immediately
```

The `tutorApplication.status` is set to `'pending'`, but the `userType` is already `'tutor'`.

### Fix Applied
1. Changed tutor signup to keep `userType: 'student'` until admin approves
2. Added `tutorApplication` data to track the pending application
3. Admin approval endpoint (`/api/tutor/approve-tutor/:userId`) changes `userType` to `'tutor'`
4. Updated login flow to check for pending applications and redirect accordingly

### Security Impact
- **Before**: Unapproved tutors had `userType: 'tutor'` immediately
- **After**: Tutors remain as `userType: 'student'` with a pending application until approved

---

## Bug #2: Login Flow Doesn't Handle Pending Tutors Properly

### Description
Users who signed up as tutors but aren't approved yet could be confused about their status. The login page needed better handling to redirect them to the pending page.

### Affected Files
- `login.html`

### Fix Applied
Added check in both student and tutor login forms to detect pending tutor applications and redirect to `tutor-pending.html` with appropriate messaging.

---

## Bug #3: Zoom Meeting Links Are Placeholder/Fake

### Description
The application generates random Zoom meeting IDs that aren't connected to real Zoom accounts. Users might be confused thinking these are real meeting links.

### Affected Files
- `routes/tutor.js`
- `tutor-dashboard.html`
- `student-dashboard.html`

### Current Behavior
- Generates random 10-digit meeting ID
- Creates a fake Zoom URL: `https://zoom.us/j/{randomId}?pwd=Tutoring2025`

### Fix Applied
1. Updated email templates to clarify tutors should use their own Zoom/Google Meet link
2. Added instructions in dashboards explaining the meeting process
3. Made it clear that the generated link is a placeholder and tutors should coordinate their own video calls

### Recommendation for Future
Integrate with Zoom API for real meeting creation, or allow tutors to input their own meeting links.

---

## Bug #4: Profile Data Not Persisting Properly

### Description
Tutor profile data (subjects, bio, availability, motivation) needs to be saved correctly during signup and displayed on dashboards.

### Affected Files
- `routes/auth.js`
- `signup.html`

### Fix Applied
Verified that `tutorProfile` object is properly saved during signup and includes:
- `subjects` - Array of subjects the tutor can teach
- `availableTimes` - Session durations they offer
- `experience` - Teaching experience
- `availability` - Weekly hours available
- `motivation` - Why they want to tutor

---

## Configuration Notes

### Email Configuration
The application uses Gmail SMTP via Nodemailer. Required environment variables:
- `EMAIL_USER` - Gmail address
- `EMAIL_PASSWORD` - Gmail App Password (NOT regular password)

### MongoDB Configuration
- `MONGODB_URI` - MongoDB connection string

### JWT Configuration
- `JWT_SECRET` - Secret key for JWT token signing

---

## Testing Checklist

### Tutor Application Flow
- [ ] New tutor signup creates user with `userType: 'student'`
- [ ] Tutor application has `status: 'pending'`
- [ ] Login redirects pending tutors to pending page
- [ ] Admin can view pending applications
- [ ] Admin approval changes `userType` to `'tutor'`
- [ ] Approved tutor can access tutor dashboard
- [ ] Denial removes application and notifies user

### Student Flow
- [ ] Student signup works correctly
- [ ] Student can create tutoring requests
- [ ] Student sees only their own requests and sessions
- [ ] Student receives email when tutor accepts request

### Tutor Flow (After Approval)
- [ ] Tutor sees requests matching their subjects
- [ ] Tutor can accept requests
- [ ] Both tutor and student receive session emails
- [ ] Tutor can mark sessions as complete
- [ ] Hours are tracked for both parties

---

---

## Bug #5: Hardcoded API URLs

### Description
Several files used hardcoded production URLs (`https://saintthunderbirdtutoring.onrender.com/...`) instead of relative URLs. This caused issues when testing locally.

### Affected Files
- `auth.js`
- `signup.html`
- `tutor-pending.html`

### Fix Applied
Changed all API URLs to relative paths (e.g., `/api/auth/signup` instead of `https://...`). This allows the app to work in any environment (local, staging, production).

---

## Summary of All Changes Made

### Files Modified

1. **routes/auth.js**
   - Changed tutor signup to keep `userType: 'student'` until admin approves
   - Added `tutorApplication` with `requestedType: 'tutor'` to track pending applications
   - Updated login endpoint to return `tutorApplication` and `tutorProfile` data

2. **routes/tutor.js**
   - Updated approve endpoint to preserve `tutorProfile` data from signup
   - Added email notification when tutor is approved via admin panel
   - Updated deny endpoint to set status to 'denied' and send email notification
   - Improved Zoom-related email templates with clearer instructions
   - Changed placeholder Zoom links to session references with instructions

3. **login.html**
   - Added check for pending tutor applicants in both student and tutor login forms
   - Redirects pending applicants to `tutor-pending.html`
   - Added proper handling for denied applications

4. **signup.html**
   - Changed API URL from hardcoded production URL to relative path
   - Updated success message to clarify admin approval process

5. **tutor-pending.html**
   - Changed API URL from hardcoded production URL to relative path
   - Added check for denied applications
   - Updates localStorage when application status changes

6. **tutor-dashboard.html**
   - Updated Zoom info banner with clearer instructions

7. **student-dashboard.html**
   - Updated info banner with step-by-step explanation of the process

8. **auth.js**
   - Changed API URL from hardcoded production URL to relative path

### New Files Created

1. **BUGS_AND_FIXES.md** (this file)
   - Documents all bugs found and fixes applied

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-02 | 1.1.0 | Fixed tutor approval flow, improved Zoom UX, added documentation |
| 2026-02-02 | 1.1.1 | Fixed hardcoded URLs, added email notifications for admin panel actions |
