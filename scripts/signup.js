function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('st-theme', isLight ? 'light' : 'dark');
    const btn = document.getElementById('signupThemeToggle');
    if (btn) btn.textContent = isLight ? '☀️' : '🌓';
}

(function applySavedTheme() {
    const savedTheme = localStorage.getItem('st-theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        const btn = document.getElementById('signupThemeToggle');
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

async function submitSignup(payload, redirectPath) {
    const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.success) {
        alert('❌ Error: ' + data.error);
        return;
    }

    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = redirectPath;
}

document.getElementById('studentSignupForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const password = document.getElementById('studentPassword').value;
    const confirmPassword = document.getElementById('studentConfirmPassword').value;
    if (password !== confirmPassword) {
        alert('❌ Passwords do not match!');
        return;
    }

    const payload = {
        firstName: document.getElementById('studentFirstName').value,
        lastName: document.getElementById('studentLastName').value,
        email: document.getElementById('studentEmail').value,
        password,
        userType: 'student'
    };

    try {
        await submitSignup(payload, 'student-dashboard.html');
        alert('✅ Signup successful! Redirecting to dashboard...');
    } catch (error) {
        alert('❌ Connection error: ' + error.message);
    }
});

document.getElementById('tutorSignupForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const password = document.getElementById('tutorPassword').value;
    const confirmPassword = document.getElementById('tutorConfirmPassword').value;
    if (password !== confirmPassword) {
        alert('❌ Passwords do not match!');
        return;
    }

    const subjects = Array.from(document.querySelectorAll('.tutor-subject:checked')).map((el) => el.value);
    if (subjects.length === 0) {
        alert('❌ Please select at least one subject you can teach!');
        return;
    }

    const payload = {
        firstName: document.getElementById('tutorFirstName').value,
        lastName: document.getElementById('tutorLastName').value,
        email: document.getElementById('tutorEmail').value,
        password,
        userType: 'tutor',
        tutorProfile: {
            subjects,
            educationLevel: document.getElementById('tutorEducation').value,
            experience: document.getElementById('tutorExperience').value,
            motivation: document.getElementById('tutorMotivation').value
        }
    };

    try {
        await submitSignup(payload, 'tutor-pending.html');
        alert('✅ Application submitted! Admin review is required before tutor approval.');
    } catch (error) {
        alert('❌ Connection error: ' + error.message);
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

const signupThemeBtn = document.getElementById('signupThemeToggle');
if (signupThemeBtn) signupThemeBtn.addEventListener('click', toggleTheme);
