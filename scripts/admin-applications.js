// Use relative path for API
        const API_BASE = '/api';

        // Check if user is authorized admin
        function checkAuthorization() {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = localStorage.getItem('authToken');

            if (!user || !token || user.email !== 'dylanduancanada@gmail.com') {
                document.getElementById('unauthorizedContainer').style.display = 'flex';
                document.getElementById('mainContainer').style.display = 'none';
                return false;
            }

            document.getElementById('unauthorizedContainer').style.display = 'none';
            document.getElementById('mainContainer').style.display = 'block';
            document.getElementById('adminEmail').textContent = `Admin: ${user.email}`;

            return true;
        }

        if (!checkAuthorization()) {
            // Show unauthorized message
        } else {
            loadSummary();
            loadApplications();
        }

        async function loadSummary() {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE}/tutor/admin-summary`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    document.getElementById('pendingCount').textContent = data.pendingCount ?? 0;
                    document.getElementById('totalCount').textContent = data.totalApplications ?? 0;
                    document.getElementById('approvedCount').textContent = data.approvedCount ?? 0;
                }
            } catch (error) {
                console.error('Error loading admin summary:', error);
            }
        }

        async function loadApplications() {
            try {
                const token = localStorage.getItem('authToken');
                // FIXED: Changed from /auth/ to /tutor/
                const response = await fetch(`${API_BASE}/tutor/pending-applications`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                if (data.success) {
                    displayApplications(data.applications);
                }
            } catch (error) {
                console.error('Error loading applications:', error);
                document.getElementById('applicationsContainer').innerHTML = `
                    <div class="empty">
                        <div class="empty-icon">⚠️</div>
                        <p>Error loading applications. Please try again.</p>
                    </div>
                `;
            }
        }

        function displayApplications(applications) {
            const container = document.getElementById('applicationsContainer');
            if (applications.length === 0) {
                container.innerHTML = `
                    <div class="empty">
                        <div class="empty-icon">✅</div>
                        <p>No pending applications. All caught up!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = applications.map(app => {
                const subjects = (app.tutorProfile?.subjects && app.tutorProfile.subjects.length > 0)
                    ? app.tutorProfile.subjects
                    : (app.tutorApplication?.subjects || []);
                const educationLevel = app.tutorProfile?.educationLevel || app.tutorApplication?.educationLevel || 'Not specified';
                const experience = app.tutorProfile?.experience || app.tutorApplication?.experience || 'Not provided';
                const motivation = app.tutorProfile?.motivation || app.tutorApplication?.motivation || 'Not provided';
                const appliedAt = app.tutorApplication?.appliedAt || app.createdAt;
                const applicationName = app.tutorApplication?.name || `${app.firstName} ${app.lastName}`;
                const age = app.tutorApplication?.age || 'Not provided';

                return `
                <div class="app-card">
                    <div class="app-header">
                        <div>
                            <div class="app-name">${applicationName}</div>
                            <div class="app-email">${app.email}</div>
                        </div>
                        <span class="badge">⏳ Pending</span>
                    </div>

                    <div class="app-details">
                        <div class="detail">
                            <div class="detail-label">👤 Applicant Info</div>
                            <div class="detail-value"><strong>Account Name:</strong> ${app.firstName} ${app.lastName}</div>
                            <div class="detail-value"><strong>Age:</strong> ${age}</div>
                        </div>

                        <div class="detail">
                            <div class="detail-label">📚 Subjects</div>
                            <div class="subjects">
                                ${(subjects.length > 0 ? subjects : ['Not specified']).map(s =>
                `<span class="subject-tag">${s}</span>`
            ).join('')}
                            </div>
                        </div>

                        <div class="detail">
                            <div class="detail-label">🎓 Education Level</div>
                            <div class="detail-value">${educationLevel}</div>
                        </div>

                        <div class="detail">
                            <div class="detail-label">📅 Applied At</div>
                            <div class="detail-value">${appliedAt ? new Date(appliedAt).toLocaleString() : 'Not available'}</div>
                        </div>

                        <div class="detail">
                            <div class="detail-label">🧾 Full Application Status</div>
                            <div class="detail-value">${app.tutorApplication?.status || 'Unknown'}</div>
                            <div class="detail-value">Account Created: ${app.createdAt ? new Date(app.createdAt).toLocaleString() : 'Unknown'}</div>
                        </div>

                        <div class="detail" style="grid-column: 1 / -1;">
                            <div class="detail-label">💼 Experience</div>
                            <div class="experience-text">${experience}</div>
                        </div>

                        <div class="detail" style="grid-column: 1 / -1;">
                            <div class="detail-label">❤️ Motivation</div>
                            <div class="motivation-text">"${motivation}"</div>
                        </div>
                    </div>

                    <div class="app-actions">
                        <button type="button" class="btn-approve" data-user-id="${app._id}" data-applicant-name="${encodeURIComponent(app.firstName + ' ' + app.lastName)}">
                            ✅ Approve
                        </button>
                        <button type="button" class="btn-deny" data-user-id="${app._id}">
                            ❌ Deny
                        </button>
                    </div>
                </div>
            `;
            }).join('');

            document.getElementById('pendingCount').textContent = applications.length;
        }

        async function approveApplication(userId, name) {
            if (!confirm(`Approve ${name}?`)) return;

            try {
                const token = localStorage.getItem('authToken');
                // FIXED: Changed from /auth/ to /tutor/
                const response = await fetch(`${API_BASE}/tutor/approve-tutor/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({})
                });

                const data = await response.json();

                if (data.success) {
                    alert(`✅ ${name} has been approved!`);
                    loadSummary();
                    loadApplications();
                } else {
                    alert('❌ Error: ' + data.error);
                }
            } catch (error) {
                alert('❌ Network error: ' + error.message);
            }
        }

        async function denyApplication(userId) {
            const reason = prompt('Enter denial reason (optional):');
            if (reason === null) return;

            try {
                const token = localStorage.getItem('authToken');
                // FIXED: Changed from /auth/ to /tutor/
                const response = await fetch(`${API_BASE}/tutor/deny-tutor/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        reason: reason
                    })
                });

                const data = await response.json();

                if (data.success) {
                    alert('❌ Application denied');
                    loadSummary();
                    loadApplications();
                } else {
                    alert('❌ Error: ' + data.error);
                }
            } catch (error) {
                alert('❌ Network error: ' + error.message);
            }
        }

        function logout() {
            if (confirm('Logout?')) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            }
        }

        // Refresh every 30 seconds
        setInterval(() => {
            if (checkAuthorization()) {
                loadSummary();
                loadApplications();
            }
        }, 30000);

        document.getElementById('applicationsContainer').addEventListener('click', (e) => {
            const approve = e.target.closest('.btn-approve');
            if (approve) {
                const name = decodeURIComponent(approve.dataset.applicantName || '');
                approveApplication(approve.dataset.userId, name);
            }
            const deny = e.target.closest('.btn-deny');
            if (deny) {
                denyApplication(deny.dataset.userId);
            }
        });

        const adminLogoutBtn = document.getElementById('adminLogoutBtn');
        if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', logout);
        const adminGoLoginBtn = document.getElementById('adminGoLoginBtn');
        if (adminGoLoginBtn) {
            adminGoLoginBtn.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }
