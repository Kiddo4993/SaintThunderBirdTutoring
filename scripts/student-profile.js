const API_URL = 'https://saintthunderbirdtutoring.onrender.com';
let selectedInterests = new Set();
let userGrade = '';

const user = getUser();
if (!user || user.userType !== 'student') {
    window.location.href = 'login.html';
} else {
    document.getElementById('studentName').textContent = user.firstName;

    async function loadUserPreferences() {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/api/tutor/available-tutors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            document.getElementById('tutorsCount').textContent = data.tutors.length || 0;
        } catch (error) {
            console.error('Error loading tutors count:', error);
        }

        if (user.interests && user.interests.length > 0) {
            selectedInterests = new Set(user.interests);
            updateInterestUI();
        }

        if (user.grade) {
            document.getElementById('gradeLevel').value = user.grade;
            userGrade = user.grade;
        }

        loadRequests();
    }

    function toggleInterest(event, interest) {
        const item = event.target.closest('.interest-item');
        if (!item) return;
        if (selectedInterests.has(interest)) {
            selectedInterests.delete(interest);
            item.classList.remove('selected');
        } else {
            selectedInterests.add(interest);
            item.classList.add('selected');
        }
    }

    function updateInterestUI() {
        const items = document.querySelectorAll('.interest-item');
        items.forEach((item) => {
            const interestName = item.querySelector('.interest-name').textContent.trim();
            if (selectedInterests.has(interestName)) {
                item.classList.add('selected');
            }
        });
    }

    function updateGrade() {
        userGrade = document.getElementById('gradeLevel').value;
    }

    async function savePreferences() {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/api/tutor/update-student-preferences`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    interests: Array.from(selectedInterests),
                    grade: userGrade
                })
            });

            const data = await res.json();

            if (data.success) {
                alert('✅ Preferences saved successfully!');
            } else {
                alert('❌ Error: ' + data.error);
            }
        } catch (error) {
            alert('Error saving preferences: ' + error.message);
        }
    }

    function toggleEmailSetting(element) {
        element.classList.toggle('active');
    }

    function goToStudentDashboard() {
        window.location.href = 'student-dashboard.html';
    }

    function logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }

    async function loadRequests() {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_URL}/api/tutor/my-requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();

            if (data.success && data.requests.length > 0) {
                const html = data.requests
                    .map(
                        (req) => `
                        <div class="request-item">
                            <div class="request-header">
                                <div class="request-subject">${req.subject}</div>
                                <div class="request-status ${req.status}">${req.status.toUpperCase()}</div>
                            </div>
                            <div class="request-message">${req.description || 'No description provided'}</div>
                            <div class="request-time">${new Date(req.createdAt).toLocaleDateString()}</div>
                        </div>
                    `
                    )
                    .join('');
                document.getElementById('requestsList').innerHTML = html;
                document.getElementById('requestsCount').textContent = data.requests.length;
            }
        } catch (error) {
            console.error('Error loading requests:', error);
        }
    }

    const interestsGrid = document.querySelector('.interests-grid');
    if (interestsGrid) {
        interestsGrid.addEventListener('click', (e) => {
            const item = e.target.closest('.interest-item');
            if (!item) return;
            const interest = item.querySelector('.interest-name').textContent.trim();
            toggleInterest(e, interest);
        });
    }

    document.getElementById('gradeLevel').addEventListener('change', updateGrade);
    document.getElementById('savePreferencesBtn').addEventListener('click', savePreferences);
    document.getElementById('profileDashboardBtn').addEventListener('click', goToStudentDashboard);
    document.getElementById('profileLogoutBtn').addEventListener('click', logout);

    document.querySelectorAll('.email-settings .toggle-switch').forEach((sw) => {
        sw.addEventListener('click', () => toggleEmailSetting(sw));
    });

    loadUserPreferences();
}
