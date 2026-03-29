function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('st-theme', isLight ? 'light' : 'dark');
    const btn = document.getElementById('loginThemeToggle');
    if (btn) btn.textContent = isLight ? '☀️' : '🌓';
}

(function applySavedTheme() {
    const savedTheme = localStorage.getItem('st-theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        const btn = document.getElementById('loginThemeToggle');
        if (btn) btn.textContent = '☀️';
    }
})();

function switchTab(tab, tabEl) {
    document.querySelectorAll('.tabs .tab').forEach((t) => t.classList.remove('active'));
    if (tabEl) tabEl.classList.add('active');
    document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
    const panel = document.getElementById(tab + '-content');
    if (panel) panel.classList.add('active');
}

function forgotPassword(userType) {
    const email = prompt(`Enter your ${userType} email address to reset your password:`);
    if (email) {
        alert(`Password reset link has been sent to ${email}. Please check your inbox.`);
    }
}

async function handleLogin(userType) {
    const isTutor = userType === 'tutor';
    const emailInputId = isTutor ? 'tutorEmail' : 'studentEmail';
    const passwordInputId = isTutor ? 'tutorPassword' : 'studentPassword';
    const rememberInputId = isTutor ? 'tutorRemember' : 'studentRemember';

    const email = document.getElementById(emailInputId).value;
    const password = document.getElementById(passwordInputId).value;
    const remember = document.getElementById(rememberInputId).checked;

    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!data.success) {
        alert('❌ Error: ' + data.error);
        return;
    }

    const user = data.user;
    const appStatus = user.tutorApplication?.status || 'none';
    const isAdmin = user.email === 'dylanduancanada@gmail.com';

    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(user));

    if (remember) {
        localStorage.setItem('rememberEmail', email);
    }

    if (!isTutor) {
        alert('✅ Welcome back, ' + user.firstName + '!');
        window.location.href = 'student-dashboard.html';
        return;
    }

    if (isAdmin) {
        alert('✅ Welcome back, Admin!');
        window.location.href = 'tutor-dashboard.html';
        return;
    }

    if (user.userType === 'tutor' && appStatus === 'approved') {
        alert('✅ Welcome back, ' + user.firstName + '!');
        window.location.href = 'tutor-dashboard.html';
        return;
    }

    if (appStatus === 'pending') {
        alert('⏳ Your tutor application is pending approval.');
        window.location.href = 'tutor-pending.html';
        return;
    }

    if (appStatus === 'denied') {
        alert('❌ Your tutor application was denied. Please contact support.');
        return;
    }

    alert('❌ You do not have a tutor application. Please sign up as a tutor first.');
}

document.getElementById('studentLoginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
        await handleLogin('student');
    } catch (error) {
        alert('❌ Connection error: ' + error.message);
    }
});

document.getElementById('tutorLoginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
        await handleLogin('tutor');
    } catch (error) {
        alert('❌ Connection error: ' + error.message);
    }
});

window.addEventListener('load', function () {
    const remembered = localStorage.getItem('rememberEmail');
    if (remembered) {
        document.getElementById('studentEmail').value = remembered;
        document.getElementById('tutorEmail').value = remembered;
    }
});

document.querySelectorAll('.tabs .tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab, tab));
    tab.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            switchTab(tab.dataset.tab, tab);
        }
    });
});

const themeBtn = document.getElementById('loginThemeToggle');
if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

document.querySelectorAll('.forgot-link').forEach((a) => {
    a.addEventListener('click', (e) => {
        e.preventDefault();
        forgotPassword(a.dataset.userType);
    });
});
