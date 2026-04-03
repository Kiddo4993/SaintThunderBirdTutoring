// ========================================
// AUTHENTICATION FUNCTIONS
// ========================================

// Use relative URL so it works in all environments (local, staging, production)
// Named AUTH_API_URL so pages can declare their own API_URL without redeclaration errors.
const AUTH_API_URL = '/api/auth';

// ========== SIGNUP HANDLERS ==========

// Student Signup
async function signupStudent(firstName, lastName, email, password, userType = 'student') {
    try {
        const response = await fetch(`${AUTH_API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName,
                lastName,
                email,
                password,
                userType
            })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            alert(`✅ Welcome, ${data.user.firstName}!`);
            window.location.href = 'student-dashboard.html';
        } else {
            alert('❌ Error: ' + data.error);
        }
    } catch (error) {
        alert('❌ Connection error: ' + error.message);
    }
}

// Tutor Signup - REDIRECT TO PENDING PAGE
async function signupTutor(firstName, lastName, email, password, userType = 'tutor') {
    try {
        const response = await fetch(`${AUTH_API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName,
                lastName,
                email,
                password,
                userType
            })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            alert(`✅ Application submitted! Please check your email for updates.`);
            // REDIRECT TO PENDING PAGE INSTEAD OF DASHBOARD
            window.location.href = 'tutor-pending.html';
        } else {
            alert('❌ Error: ' + data.error);
        }
    } catch (error) {
        alert('❌ Connection error: ' + error.message);
    }
}

// ========== LOGIN HANDLERS ==========

async function login(email, password, userType = 'student') {
    try {
        const response = await fetch(`${AUTH_API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            const user = data.user;
            const appStatus = user.tutorApplication?.status || 'none';
            const isAdmin = user.email === 'dylanduancanada@gmail.com';

            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(user));

            // Route based on ACTUAL DB role/status, not which tab they clicked
            // 1. Admin always goes to tutor dashboard (has admin button there)
            if (isAdmin) {
                alert(`✅ Welcome back, Admin!`);
                window.location.href = 'tutor-dashboard.html';
                return;
            }

            // 2. Approved tutors go to tutor dashboard
            if (user.userType === 'tutor' && appStatus === 'approved') {
                alert(`✅ Welcome back, ${user.firstName}!`);
                window.location.href = 'tutor-dashboard.html';
                return;
            }

            // 3. Pending tutor applicants (userType:'tutor', appStatus:'pending')
            if (appStatus === 'pending') {
                alert('⏳ Your tutor application is pending approval.');
                window.location.href = 'tutor-pending.html';
                return;
            }

            // 4. Denied tutor applicants — show error
            if (appStatus === 'denied') {
                alert('❌ Your tutor application was denied. Please contact support.');
                return;
            }

            // 5. Pure students (no tutor application) go to student dashboard
            if (user.userType === 'student' && appStatus === 'none') {
                alert(`✅ Welcome back, ${user.firstName}!`);
                window.location.href = 'student-dashboard.html';
                return;
            }

            // 6. Fallback: if somehow userType is 'tutor' but status isn't approved
            //    (shouldn't happen, but safety net)
            if (user.userType === 'tutor') {
                alert(`✅ Welcome back, ${user.firstName}!`);
                window.location.href = 'tutor-dashboard.html';
                return;
            }

            // 7. Default fallback
            alert(`✅ Welcome back, ${user.firstName}!`);
            window.location.href = 'student-dashboard.html';
        } else {
            alert('❌ Error: ' + data.error);
        }
    } catch (error) {
        alert('❌ Connection error: ' + error.message);
    }
}

// ========== LOGOUT HANDLER ==========

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberEmail');
    alert('✅ You have been logged out');
    window.location.href = 'index.html';
}

// ========== UTILITY FUNCTIONS ==========

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function isAuthenticated() {
    return !!getAuthToken();
}

function redirectIfNotAuthenticated() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

// ========== FORM SETUP HELPERS ==========

function setupStudentSignupForm() {
    const form = document.getElementById('studentSignupForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = document.getElementById('studentPassword').value;
        const confirmPassword = document.getElementById('studentConfirmPassword').value;

        if (password !== confirmPassword) {
            alert('❌ Passwords do not match!');
            return;
        }

        const firstName = document.getElementById('studentFirstName').value;
        const lastName = document.getElementById('studentLastName').value;
        const email = document.getElementById('studentEmail').value;

        await signupStudent(firstName, lastName, email, password, 'student');
    });
}

function setupTutorSignupForm() {
    const form = document.getElementById('tutorSignupForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = document.getElementById('tutorPassword').value;
        const confirmPassword = document.getElementById('tutorConfirmPassword').value;

        if (password !== confirmPassword) {
            alert('❌ Passwords do not match!');
            return;
        }

        const firstName = document.getElementById('tutorFirstName').value;
        const lastName = document.getElementById('tutorLastName').value;
        const email = document.getElementById('tutorEmail').value;

        await signupTutor(firstName, lastName, email, password, 'tutor');
    });
}

function setupLoginForms() {
    // Student Login Form
    const studentForm = document.getElementById('studentLoginForm');
    if (studentForm) {
        studentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('studentEmail').value;
            const password = document.getElementById('studentPassword').value;
            const remember = document.getElementById('studentRemember').checked;

            if (remember) {
                localStorage.setItem('rememberEmail', email);
            }

            await login(email, password, 'student');
        });
    }

    // Tutor Login Form
    const tutorForm = document.getElementById('tutorLoginForm');
    if (tutorForm) {
        tutorForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('tutorEmail').value;
            const password = document.getElementById('tutorPassword').value;
            const remember = document.getElementById('tutorRemember').checked;

            if (remember) {
                localStorage.setItem('rememberEmail', email);
            }

            await login(email, password, 'tutor');
        });
    }
}

// Load remembered email on page load
function loadRememberedEmail() {
    const remembered = localStorage.getItem('rememberEmail');
    if (remembered) {
        const studentEmail = document.getElementById('studentEmail');
        const tutorEmail = document.getElementById('tutorEmail');

        if (studentEmail) studentEmail.value = remembered;
        if (tutorEmail) tutorEmail.value = remembered;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // setupStudentSignupForm(); // Removed to prevent duplicate event listeners on signup.html
    // setupTutorSignupForm();   // Removed to prevent duplicate event listeners on signup.html
    // setupLoginForms(); // Removed to prevent duplicate event listeners on login.html
    loadRememberedEmail();
});
