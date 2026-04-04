/**
 * Bug fix verification tests — no test framework required.
 * Run: node test-bug-fixes.js
 *
 * Tests the three code changes from audit v2:
 *   A1 — Signup userType fix
 *   A2 — Tutor dashboard guard fix
 *   A8 — Deny route no longer unsets tutorApplication
 *
 * Also validates the User model schema has the new fields.
 */

'use strict';

const assert = require('node:assert/strict');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ PASS  ${name}`);
        passed++;
    } catch (e) {
        console.error(`  ❌ FAIL  ${name}`);
        console.error(`           ${e.message}`);
        failed++;
    }
}

// ─────────────────────────────────────────────────────────────
// Bug A1 — Signup userType must NOT downgrade 'tutor' → 'student'
// ─────────────────────────────────────────────────────────────
console.log('\nBug A1 — Signup userType logic');

// Extracted from web/app/api/auth/signup/route.js
function computeActualUserType_FIXED(userType) {
    return userType; // the fixed line
}
function computeActualUserType_BUGGY(userType) {
    return userType === 'tutor' ? 'student' : userType; // the old bug
}

test('tutor signup stores userType as "tutor" (fixed)', () => {
    assert.equal(computeActualUserType_FIXED('tutor'), 'tutor');
});
test('student signup still stores as "student" (unaffected)', () => {
    assert.equal(computeActualUserType_FIXED('student'), 'student');
});
test('buggy version would have stored tutor as "student" [regression proof]', () => {
    assert.equal(computeActualUserType_BUGGY('tutor'), 'student');
});
test('fixed version differs from buggy version for userType "tutor"', () => {
    assert.notEqual(
        computeActualUserType_FIXED('tutor'),
        computeActualUserType_BUGGY('tutor')
    );
});

// Verify the fix is actually in the source file
const fs = require('node:fs');
const signupSrc = fs.readFileSync('./web/app/api/auth/signup/route.js', 'utf8');

test('signup route no longer contains the downgrade expression', () => {
    const bugLine = "userType === 'tutor' ? 'student' : userType";
    assert.ok(!signupSrc.includes(bugLine), `Found the bug line in source: "${bugLine}"`);
});
test('signup route contains the fixed assignment', () => {
    assert.ok(
        signupSrc.includes('const actualUserType = userType;'),
        'Expected "const actualUserType = userType;" in signup route'
    );
});

// ─────────────────────────────────────────────────────────────
// Bug A2 — Tutor dashboard guard must block pending & denied tutors
//          AND allow approved tutors through
// ─────────────────────────────────────────────────────────────
console.log('\nBug A2 — Tutor dashboard guard logic');

const ADMIN_EMAIL = 'dylanduancanada@gmail.com';

/**
 * Mirrors the fixed guard logic from web/app/tutor-dashboard/page.js.
 * Returns: 'dashboard' | '/login' | '/tutor-pending'
 */
function evaluateGuard(user) {
    if (user.email === ADMIN_EMAIL) return 'dashboard';

    if (user.userType !== 'tutor') return '/login';

    const appStatus = user.tutorApplication?.status;
    if (appStatus !== 'approved') {
        return appStatus === 'pending' ? '/tutor-pending' : '/login';
    }

    return 'dashboard';
}

/**
 * Mirrors the BUGGY guard logic (before fix).
 * With Bug A1 also present (tutors stored as 'student'), approved tutors
 * would always fail the `userType !== 'tutor'` check.
 * With Bug A1 fixed but guard unfixed, pending tutors would pass through.
 */
function evaluateGuard_BUGGY(user) {
    if (user.userType !== 'tutor' && user.email !== ADMIN_EMAIL) {
        const appStatus = user.tutorApplication?.status;
        return appStatus === 'pending' ? '/tutor-pending' : '/login';
    }
    return 'dashboard';
}

// Approved tutor
const approvedTutor = { email: 'tutor@test.com', userType: 'tutor', tutorApplication: { status: 'approved' } };
test('approved tutor reaches the dashboard', () => {
    assert.equal(evaluateGuard(approvedTutor), 'dashboard');
});

// Pending tutor (after A1 fix their userType is now 'tutor')
const pendingTutor = { email: 'pending@test.com', userType: 'tutor', tutorApplication: { status: 'pending' } };
test('pending tutor is redirected to /tutor-pending', () => {
    assert.equal(evaluateGuard(pendingTutor), '/tutor-pending');
});
test('buggy guard would let pending tutor (now userType=tutor) into dashboard [regression proof]', () => {
    assert.equal(evaluateGuard_BUGGY(pendingTutor), 'dashboard');
});

// Denied tutor
const deniedTutor = { email: 'denied@test.com', userType: 'tutor', tutorApplication: { status: 'denied' } };
test('denied tutor is redirected to /login', () => {
    assert.equal(evaluateGuard(deniedTutor), '/login');
});

// Tutor with no application object at all
const noAppTutor = { email: 'noapp@test.com', userType: 'tutor', tutorApplication: undefined };
test('tutor with missing tutorApplication is redirected to /login', () => {
    assert.equal(evaluateGuard(noAppTutor), '/login');
});

// Non-tutor (plain student) trying to access tutor dashboard
const student = { email: 'student@test.com', userType: 'student', tutorApplication: undefined };
test('student is redirected to /login', () => {
    assert.equal(evaluateGuard(student), '/login');
});

// Admin bypass
const admin = { email: ADMIN_EMAIL, userType: 'student' };
test('admin email bypasses all checks and reaches dashboard', () => {
    assert.equal(evaluateGuard(admin), 'dashboard');
});

// Verify the fix is in the source file
const dashboardSrc = fs.readFileSync('./web/app/tutor-dashboard/page.js', 'utf8');

test('dashboard guard checks appStatus !== "approved"', () => {
    assert.ok(
        dashboardSrc.includes('appStatus !== "approved"'),
        'Expected appStatus !== "approved" check in dashboard guard'
    );
});
test('dashboard guard no longer uses old single-condition pattern', () => {
    const oldPattern = 'u.userType !== "tutor" && u.email !== ADMIN_EMAIL';
    assert.ok(!dashboardSrc.includes(oldPattern), `Found old guard pattern: "${oldPattern}"`);
});

// ─────────────────────────────────────────────────────────────
// Bug A8 — Legacy deny route must NOT $unset tutorApplication
// ─────────────────────────────────────────────────────────────
console.log('\nBug A8 — Legacy deny route (GET /api/tutor/deny/[userId])');

const denySrc = fs.readFileSync('./web/app/api/tutor/deny/[userId]/route.js', 'utf8');

test('deny route no longer calls $unset on tutorApplication', () => {
    assert.ok(
        !denySrc.includes('$unset'),
        'Found $unset in deny route — the bug is still present'
    );
});
test('deny route sets status to "denied"', () => {
    assert.ok(
        denySrc.includes("'tutorApplication.status': 'denied'"),
        'Expected tutorApplication.status set to denied'
    );
});
test('deny route saves deniedAt timestamp', () => {
    assert.ok(
        denySrc.includes("'tutorApplication.deniedAt': new Date()"),
        'Expected deniedAt timestamp to be set'
    );
});

// Confirm the correct POST deny route still uses $set (not $unset either)
const postDenySrc = fs.readFileSync('./web/app/api/tutor/deny-tutor/[userId]/route.js', 'utf8');
test('POST deny-tutor route has no $unset (was already correct)', () => {
    assert.ok(!postDenySrc.includes('$unset'), 'Found $unset in POST deny-tutor route');
});

// ─────────────────────────────────────────────────────────────
// Model schema — new fields must be present in User.js
// ─────────────────────────────────────────────────────────────
console.log('\nUser model schema — new fields');

const modelSrc = fs.readFileSync('./web/lib/models/User.js', 'utf8');

test('tutorApplication schema has deniedAt field', () => {
    assert.ok(modelSrc.includes('deniedAt: Date'), 'Missing deniedAt: Date in User model');
});
test('tutorApplication schema has denialReason field', () => {
    assert.ok(modelSrc.includes('denialReason: String'), 'Missing denialReason: String in User model');
});
test('tutorApplication schema has requestedType field', () => {
    assert.ok(modelSrc.includes('requestedType: String'), 'Missing requestedType: String in User model');
});
test('userType enum still includes admin', () => {
    assert.ok(
        modelSrc.includes("'student', 'tutor', 'admin'"),
        'userType enum is missing admin'
    );
});

// ─────────────────────────────────────────────────────────────
// Error logging — catch blocks must not be silent
// ─────────────────────────────────────────────────────────────
console.log('\nError logging — silent catch blocks');

const studentDashSrc = fs.readFileSync('./web/app/student-dashboard/page.js', 'utf8');
const tutorDashSrc   = fs.readFileSync('./web/app/tutor-dashboard/page.js',   'utf8');

test('tutor dashboard has no remaining empty catch {}', () => {
    // The only acceptable catch is inside a non-load function (acceptRequest uses try/catch with alert)
    // We check that bare "catch {}" (with no body) is gone from load functions
    const silentCatches = (tutorDashSrc.match(/\} catch \{\}/g) || []).length;
    assert.equal(silentCatches, 0, `Found ${silentCatches} empty catch {} in tutor dashboard`);
});
test('student dashboard has no remaining empty catch {}', () => {
    const silentCatches = (studentDashSrc.match(/\} catch \{\}/g) || []).length;
    assert.equal(silentCatches, 0, `Found ${silentCatches} empty catch {} in student dashboard`);
});
test('tutor dashboard loadStats logs errors', () => {
    assert.ok(tutorDashSrc.includes('console.error("Stats fetch'), 'Missing console.error in loadStats');
});
test('student dashboard loadStats logs errors', () => {
    assert.ok(studentDashSrc.includes('console.error("Student stats'), 'Missing console.error in student loadStats');
});

// ─────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
    console.error('Some tests failed — check the output above.');
    process.exit(1);
} else {
    console.log('All bug fix tests passed.');
}
