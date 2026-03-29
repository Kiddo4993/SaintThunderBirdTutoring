// FIX 1: Ensure API_URL points to the correct base
        const API_URL = '/api';

        document.addEventListener('DOMContentLoaded', async function () {
            let user = getUser();

            // Safety check: if no user, go to login
            if (!user) {
                window.location.href = 'login.html';
                return;
            }

            // CRITICAL: Re-fetch user profile from server to get latest approval status
            // This fixes the bug where approved tutors still see the pending page
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const profileRes = await fetch('/api/auth/profile', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (profileRes.ok) {
                        const profileData = await profileRes.json();
                        if (profileData.success && profileData.user) {
                            // Update localStorage with fresh data
                            user = {
                                id: profileData.user._id,
                                firstName: profileData.user.firstName,
                                lastName: profileData.user.lastName,
                                email: profileData.user.email,
                                userType: profileData.user.userType,
                                tutorApplication: profileData.user.tutorApplication,
                                tutorProfile: profileData.user.tutorProfile
                            };
                            localStorage.setItem('user', JSON.stringify(user));
                        }
                    }
                } catch (e) {
                    console.warn('Could not refresh profile, using cached data:', e.message);
                }
            }

            // Admin Redirect Logic
            if (user.email === 'dylanduancanada@gmail.com') {
                const adminBtn = document.getElementById('adminBtn');
                if (adminBtn) adminBtn.style.display = 'inline-block';
            }

            // Ensure only tutors (or admin) stay here
            if (user.userType !== 'tutor' && user.email !== 'dylanduancanada@gmail.com') {
                // Check if they have a pending application — send to pending page
                const appStatus = user.tutorApplication?.status;
                if (appStatus === 'pending') {
                    window.location.href = 'tutor-pending.html';
                } else {
                    window.location.href = 'login.html';
                }
                return;
            }

            const nameEl = document.getElementById('tutorName');
            if (nameEl) nameEl.textContent = user.firstName;

            const logoutBtn = document.getElementById('tutorLogoutBtn');
            if (logoutBtn) logoutBtn.addEventListener('click', logout);
            const adminBtnEl = document.getElementById('adminBtn');
            if (adminBtnEl) adminBtnEl.addEventListener('click', goToAdmin);

            loadDashboard();

            // Auto-refresh every 30 seconds
            setInterval(loadDashboard, 30000);
        });

        async function loadDashboard() {
            const token = localStorage.getItem('authToken');

            // Load everything at once
            loadTutorStats(token);
            loadStudentRequests(token);
            loadCompletedSessions(token);
        }

        // Load tutor stats from correct endpoint
        async function loadTutorStats(token) {
            try {
                const response = await fetch(`${API_URL}/tutor/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('📊 Tutor stats:', data);

                if (data.success) {
                    // Update stats cards
                    const sessionsCountEl = document.getElementById('sessionsCount');
                    const hoursCountEl = document.getElementById('hoursCount');

                    if (sessionsCountEl) {
                        sessionsCountEl.textContent = data.sessionsCompleted || 0;
                    }
                    if (hoursCountEl) {
                        hoursCountEl.textContent = data.hoursTaught || '0';
                    }
                }
            } catch (error) {
                console.error('❌ Stats error:', error);
            }
        }

        async function loadStudentRequests(token) {
            const tokenToUse = token || localStorage.getItem('authToken');
            const container = document.getElementById('studentRequests');
            if (!container) return;

            try {
                const response = await fetch(`${API_URL}/tutor/requests`, {
                    headers: { Authorization: `Bearer ${tokenToUse}` }
                });
                const data = await response.json();

                if (!data.success) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">⚠️</div>
                            <div class="empty-state-text">Could not load requests</div>
                        </div>`;
                    return;
                }

                const requests = data.requests || [];
                if (requests.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">📝</div>
                            <div class="empty-state-text">No student requests yet</div>
                            <div class="empty-state-subtext">Students will appear here when they request help in your subjects</div>
                        </div>`;
                    return;
                }

                const timeLabels = {
                    '30min': '30 minutes',
                    '1hour': '1 hour',
                    '1.5hours': '1.5 hours',
                    '2hours': '2 hours'
                };

                container.innerHTML = requests
                    .map(
                        (req) => `
                        <div class="student-request-card" style="margin-bottom: 1.5rem;">
                            <div class="student-name">${req.studentName}</div>
                            <div class="student-subject">${req.subject || 'General'}</div>
                            <div class="request-info">
                                <div class="info-item">
                                    <div class="info-label">Student email</div>
                                    <div class="info-value" style="font-size: 0.9rem;">${req.studentEmail || ''}</div>
                                </div>
                                <div class="info-item">
                                    <div class="info-label">Duration</div>
                                    <div class="info-value" style="font-size: 0.9rem;">${timeLabels[req.requestedTime] || req.requestedTime || '—'}</div>
                                </div>
                            </div>
                            <p style="color: #ccc; font-size: 0.9rem; margin: 0.75rem 0;">${req.description || ''}</p>
                            <button type="button" class="accept-btn tutor-accept-request-btn" data-request-id="${String(req._id).replace(/"/g, '&quot;')}">
                                ✅ Accept Request & Generate Zoom Meeting
                            </button>
                        </div>
                    `
                    )
                    .join('');
            } catch (error) {
                console.error('❌ Request load error:', error);
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">⚠️</div>
                        <div class="empty-state-text">Error loading requests</div>
                        <div class="empty-state-subtext">${error.message}</div>
                    </div>`;
            }
        }

        document.addEventListener('click', (e) => {
            const acceptBtn = e.target.closest('.tutor-accept-request-btn');
            if (acceptBtn) {
                const id = acceptBtn.getAttribute('data-request-id');
                if (id) acceptRequest(id);
                return;
            }
            const completeBtn = e.target.closest('.tutor-complete-session-btn');
            if (completeBtn) {
                const sid = completeBtn.getAttribute('data-session-id');
                if (sid) completeSession(sid);
            }
        });

        // Accept request and trigger email automation
        async function acceptRequest(requestId) {
            if (!requestId) {
                alert('❌ Invalid request ID');
                return;
            }

            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('❌ Not authenticated. Please log in again.');
                window.location.href = 'login.html';
                return;
            }

            try {
                console.log('📝 Accepting request:', requestId);

                const response = await fetch(`${API_URL}/tutor/accept-request`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ requestId })
                });

                const data = await response.json();
                console.log('📦 Accept response:', data);

                if (response.ok && data.success) {
                    alert('✅ Request accepted! Check your email for the Zoom link details. The student received the same link.');
                    // Refresh the dashboard
                    loadDashboard();
                } else {
                    const errorMsg = data.error || data.message || 'Failed to accept request';
                    console.error('❌ Accept error:', errorMsg);
                    alert('❌ Error: ' + errorMsg);
                }
            } catch (error) {
                console.error('❌ Accept request error:', error);
                alert('❌ Error accepting request: ' + error.message);
            }
        }

        // Load only completed sessions
        async function loadCompletedSessions(token) {
            const container = document.getElementById('mySessions');
            if (!container) return;

            try {
                const response = await fetch(`${API_URL}/tutor/sessions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await response.json();
                console.log('📦 Sessions data:', data);

                const renderSessions = (data.sessions || []).filter((s) => s.status === 'completed' || s.status === 'scheduled');

                if (data.success && renderSessions.length > 0) {
                    container.innerHTML = renderSessions.map(session => {
                        const sessionDate = new Date(session.scheduledTime);
                        const isCompleted = session.status === 'completed';

                        return `
                            <div class="student-request-card" style="margin-bottom: 1.5rem;">
                                <div class="student-name">${session.studentName || 'Unknown Student'}</div>
                                <div class="student-subject">${session.subject || 'General'}</div>
                                
                                <div class="request-info">
                                    <div class="info-item">
                                        <div class="info-label">Student Email</div>
                                        <div class="info-value" style="font-size: 0.9rem;">${session.studentEmail || 'N/A'}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">Scheduled Time</div>
                                        <div class="info-value" style="font-size: 0.9rem;">${sessionDate.toLocaleString()}</div>
                                    </div>
                                    <div class="info-item">
                                        <div class="info-label">Status</div>
                                        <div class="info-value" style="font-size: 0.9rem;">${isCompleted ? 'Completed ✅' : 'Upcoming 🗓️'}</div>
                                    </div>
                                </div>
                                
                                ${session.zoomLink ? `
                                    <div style="background: rgba(59, 130, 246, 0.2); border: 2px solid rgba(59, 130, 246, 0.5); padding: 1rem; border-radius: 8px; margin: 1rem 0; text-align: center;">
                                        <p style="margin-bottom: 0.5rem; font-size: 0.9rem;"><strong>Meeting ID:</strong> ${session.zoomMeetingId || 'N/A'}</p>
                                        <a href="${session.zoomLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #60a5fa, #3b82f6); color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 700;">
                                            🎥 Join Zoom Meeting
                                        </a>
                                    </div>
                                ` : ''}
                                
                                ${isCompleted ? `
                                <div style="background: rgba(34, 197, 94, 0.2); border: 2px solid rgba(34, 197, 94, 0.5); padding: 1rem; border-radius: 8px; text-align: center; color: #22c55e; font-weight: 600;">
                                    ✅ Session Completed${session.completedAt ? ` on ${new Date(session.completedAt).toLocaleString()}` : ''}
                                </div>
                                ` : `
                                <div style="margin-top: 1rem; display: flex; gap: 1rem; align-items: center;">
                                    <input type="number" id="hours-${session._id}" placeholder="Hours spent (e.g. 1)" min="0.5" step="0.5" style="padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border); background: rgba(255,255,255,0.1); color: white; width: 150px;">
                                    <button type="button" class="accept-btn tutor-complete-session-btn" style="margin-top: 0; width: auto; flex-grow: 1;" data-session-id="${session._id}">
                                        Mark as Completed
                                    </button>
                                </div>
                                `}
                            </div>
                        `;
                    }).join('');
                } else {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">✅</div>
                            <div class="empty-state-text">No sessions yet</div>
                            <div class="empty-state-subtext">Accepted and completed sessions will appear here</div>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('❌ Session load error:', error);
                container.innerHTML = '<div class="loading">Error loading sessions</div>';
            }
        }

        // Complete a session
        async function completeSession(sessionId) {
            const hoursInput = document.getElementById(`hours-${sessionId}`);
            const hoursSpent = parseFloat(hoursInput?.value) || 1;

            if (hoursSpent <= 0) {
                alert('❌ Please enter a valid number of hours');
                return;
            }

            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('❌ Not authenticated. Please log in again.');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/tutor/complete-session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ sessionId, hoursSpent })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    alert(`✅ Session completed! ${hoursSpent} hour(s) logged. Admin has been notified.`);
                    loadDashboard(); // Refresh
                } else {
                    alert('❌ Error: ' + (data.error || 'Failed to complete session'));
                }
            } catch (error) {
                console.error('❌ Complete session error:', error);
                alert('❌ Error: ' + error.message);
            }
        }

        function logout() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        }

        function goToAdmin() {
            window.location.href = 'admin-applications.html';
        }
