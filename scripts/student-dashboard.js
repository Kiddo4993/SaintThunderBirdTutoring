const API_URL = '/api';

        async function submitQuickInlineRequest() {
            const subject = document.getElementById('req-subject').value;
            const hours = document.getElementById('req-hours').value;
            if (!subject || !hours) {
                alert('Please select both a subject and hours.');
                return;
            }
            const hourToTime = { '0.5': '30min', '1': '1hour', '1.5': '1.5hours', '2': '2hours' };
            const requestedTime = hourToTime[hours];
            if (!requestedTime) {
                alert('Invalid duration selection.');
                return;
            }
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('You are logged out. Please log in again.');
                window.location.href = 'login.html';
                return;
            }
            try {
                const res = await fetch(`${API_URL}/tutor/create-request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        subject,
                        requestedTime,
                        description: '',
                        priority: 'medium'
                    })
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok && data.success) {
                    document.getElementById('req-status').style.display = 'block';
                    setTimeout(() => {
                        document.getElementById('quickInlineRequestModal').style.display = 'none';
                        document.getElementById('req-status').style.display = 'none';
                        loadDashboard();
                    }, 1500);
                } else {
                    alert(data.error || data.message || 'Error sending request');
                }
            } catch (e) {
                alert('Error sending request: ' + e.message);
            }
        }

        // Toast notification function
        function showToast(message, type = 'success') {
            // Remove any existing toast
            const existing = document.querySelector('.toast-notification');
            if (existing) existing.remove();

            const toast = document.createElement('div');
            toast.className = `toast-notification ${type}`;
            toast.textContent = message;
            document.body.appendChild(toast);

            // Fade out and remove after 4 seconds
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 400);
            }, 4000);
        }

        // Load available subjects from tutors
        async function loadAvailableSubjects() {
            try {
                const token = localStorage.getItem('authToken');
                const res = await fetch(`${API_URL}/tutor/available-tutors`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) throw new Error(`API error: ${res.status}`);
                const data = await res.json();
                if (!data.success || !data.tutors) throw new Error('Invalid API response');

                const subjectEmojis = {
                    'Mathematics': '📐', 'Sciences': '🔬', 'Languages': '🌐',
                    'Social Studies': '📚', 'Technology': '💻', 'Arts & Culture': '🎨',
                    'General': '📖', 'General Help': '📖'
                };
                // Collect unique subjects from all approved tutors
                const subjects = new Set();
                data.tutors.forEach(tutor => {
                    const tutorSubjects = tutor.tutorProfile?.subjects || [];
                    tutorSubjects.forEach(s => {
                        if (s && s !== 'General' && s !== 'General Help') subjects.add(s);
                    });
                });

                // If no specific subjects found, show all defaults
                if (subjects.size === 0) {
                    ['Mathematics', 'Sciences', 'Languages', 'Social Studies', 'Technology', 'Arts & Culture'].forEach(s => subjects.add(s));
                }

                // Populate quick request dropdown
                const quickSelect = document.getElementById('quickRequestSubject');
                if (quickSelect) {
                    quickSelect.innerHTML = '<option value="">Select a subject</option>';
                    Array.from(subjects).sort().forEach(s => {
                        const emoji = subjectEmojis[s] || '📚';
                        quickSelect.innerHTML += `<option value="${s}">${s} ${emoji}</option>`;
                    });
                }

                // Also populate modal dropdown
                const modalSelect = document.getElementById('requestSubject');
                if (modalSelect) {
                    modalSelect.innerHTML = '<option value="">Select a subject</option>';
                    Array.from(subjects).sort().forEach(s => {
                        const emoji = subjectEmojis[s] || '📚';
                        modalSelect.innerHTML += `<option value="${s}">${s} ${emoji}</option>`;
                    });
                }
            } catch (error) {
                console.error('Error loading subjects:', error);

                // Fallback options
                const fallbackOptions = `
                    <option value="">Select a subject</option>
                    <option value="Mathematics">Mathematics 📐</option>
                    <option value="Sciences">Sciences 🔬</option>
                    <option value="Languages">Languages 🌐</option>
                    <option value="Social Studies">Social Studies 📚</option>
                    <option value="Technology">Technology 💻</option>
                    <option value="Arts & Culture">Arts & Culture 🎨</option>
                `;

                const quickSelect = document.getElementById('quickRequestSubject');
                if (quickSelect) quickSelect.innerHTML = fallbackOptions;

                const modalSelect = document.getElementById('requestSubject');
                if (modalSelect) modalSelect.innerHTML = fallbackOptions;
            }
        }

        // Load all data on page load
        async function loadDashboard() {
            console.log('📊 Loading dashboard...');
            await loadRequests();
            await loadSessions();
            await loadStudentStats();
        }

        // Load student stats
        async function loadStudentStats() {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${API_URL}/tutor/student-stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        document.getElementById('requestsCount').textContent = data.requestsMade || 0;
                        document.getElementById('completedCount').textContent = data.completedSessions || 0;
                        document.getElementById('hoursCount').textContent = data.hoursLearned || '0';
                    }
                }
            } catch (error) {
                console.error('Error loading student stats:', error);
            }
        }
        // Replace loadTutors with loadSessions
        async function loadSessions() {
            try {
                const token = localStorage.getItem('authToken');
                const url = `${API_URL}/tutor/student-sessions`;
                console.log('📍 Fetching sessions from:', url);

                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const data = await res.json();
                const container = document.getElementById('sessions-container');

                if (data.success && data.sessions && data.sessions.length > 0) {
                    const html = data.sessions.map(session => {
                        let linkHtml = '';
                        if (session.zoomLink) {
                            linkHtml = `<div style="margin-top: 1rem;"><a href="${session.zoomLink}" target="_blank" class="btn-primary" style="display: inline-block; text-decoration: none; text-align: center; font-size: 0.8rem; padding: 0.5rem 1rem;">Join Meeting</a></div>`;
                            if (session.zoomMeetingId) {
                                linkHtml += `<div style="font-size: 0.85rem; color: #9ca3af; margin-top: 0.5rem;">Meeting ID: ${session.zoomMeetingId}</div>`;
                            }
                        } else {
                            linkHtml = `<div style="margin-top: 1rem; color: #9ca3af; font-size: 0.9rem;">Link will be emailed when tutor starts session</div>`;
                        }

                        return `
                                <div class="session-card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                                    <div>
                                        <div class="session-header" style="flex-direction: column; align-items: start; gap: 0.5rem;">
                                            <div class="tutor-name">${session.tutorName}</div>
                                            <div class="session-time" style="font-size: 0.85rem; align-self: flex-start;">${new Date(session.scheduledTime).toLocaleString()}</div>
                                        </div>
                                        <div class="session-subject">${session.subject}</div>
                                        <div style="font-size: 0.9rem; margin-bottom: 0.5rem; text-transform: uppercase; color: var(--text-secondary); font-weight: bold;">Status: ${session.status}</div>
                                    </div>
                                    ${linkHtml}
                                </div>
                            `;
                    }).join('');

                    container.innerHTML = html;
                } else {
                    container.innerHTML = `
                            <div class="empty-state" style="grid-column: 1 / -1;">
                                <div class="empty-state-icon">🎓</div>
                                <div class="empty-state-text">No upcoming sessions</div>
                                <div class="empty-state-subtext">When a tutor accepts your request, it will appear here.</div>
                            </div>
                        `;
                }
            } catch (error) {
                console.error('❌ Error loading sessions:', error);
                document.getElementById('sessions-container').innerHTML = '<div class="loading">Error loading sessions</div>';
            }
        }

        // Track which accepted requests we've already notified about
        let notifiedAcceptedRequests = JSON.parse(localStorage.getItem('notifiedAcceptedRequests') || '[]');

        // Load student's requests
        async function loadRequests() {
            try {
                const token = localStorage.getItem('authToken');
                const url = `${API_URL}/tutor/my-requests`;
                console.log('📍 Fetching requests from:', url);

                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                console.log('📡 Response status:', res.status);

                const data = await res.json();
                console.log('📦 Requests data:', data);

                const container = document.getElementById('yourRequests');

                if (data.success && data.requests && data.requests.length > 0) {
                    // Check for newly accepted requests
                    const newlyAcceptedRequests = data.requests.filter(req =>
                        req.status === 'accepted' &&
                        req.acceptedAt &&
                        !notifiedAcceptedRequests.includes(req._id || req.createdAt)
                    );

                    // Show popup for newly accepted requests
                    if (newlyAcceptedRequests.length > 0) {
                        newlyAcceptedRequests.forEach(req => {
                            showAcceptedNotification(req);
                            // Add to notified list
                            notifiedAcceptedRequests.push(req._id || req.createdAt);
                        });
                        // Save notified list
                        localStorage.setItem('notifiedAcceptedRequests', JSON.stringify(notifiedAcceptedRequests));
                    }

                    const html = data.requests.map(req => {
                        const timeLabels = {
                            '30min': '30 minutes',
                            '1hour': '1 hour',
                            '1.5hours': '1.5 hours',
                            '2hours': '2 hours'
                        };
                        const timeLabel = timeLabels[req.requestedTime] || req.requestedTime || 'Not specified';

                        return `
                    <div class="request-card">
                        <div class="request-subject">${req.subject}</div>
                        <span class="request-status status-${req.status}">${req.status.toUpperCase()}</span>
                        
                        <div class="request-description">
                            "${req.description || 'No additional details provided'}"
                        </div>

                        <div style="font-size: 0.9rem; color: var(--beige); margin: 0.75rem 0; font-weight: 600;">
                            ⏱️ Duration: ${timeLabel}
                        </div>

                        <div style="font-size: 0.85rem; color: #9ca3af;">
                            📅 Submitted: ${new Date(req.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                `;
                    }).join('');

                    container.innerHTML = html;
                } else {
                    // Stats will be updated by loadStudentStats
                    container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📖</div>
                        <div class="empty-state-text">No requests yet</div>
                        <div class="empty-state-subtext">Create your first request to find a tutor!</div>
                    </div>
                `;
                }
            } catch (error) {
                console.error('❌ Error loading requests:', error);
            }
        }

        // Show notification popup when request is accepted
        function showAcceptedNotification(request) {
            // Create popup element
            const popup = document.createElement('div');
            popup.id = 'acceptedNotification';
            popup.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(22, 163, 74, 0.95));
                    border: 2px solid rgba(34, 197, 94, 0.8);
                    border-radius: 16px;
                    padding: 2rem;
                    max-width: 450px;
                    width: 90%;
                    z-index: 10000;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    text-align: center;
                    color: white;
                    font-family: 'Orbitron', sans-serif;
                `;

            popup.innerHTML = `
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
                    <h2 style="font-size: 1.5rem; margin-bottom: 1rem; color: white;">Great News!</h2>
                    <p style="font-size: 1.1rem; margin-bottom: 1rem; line-height: 1.6;">
                        A tutor has accepted your request for <strong>${request.subject}</strong>!
                    </p>
                    <div style="background: rgba(255, 255, 255, 0.2); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                        <p style="margin: 0; font-size: 1rem;">
                            📧 <strong>Check your email!</strong><br>
                            Your tutor will send you a Zoom link to start your session.
                        </p>
                    </div>
                    <button type="button" class="accepted-notification-close" style="
                        background: white;
                        color: #16a34a;
                        border: none;
                        padding: 0.75rem 2rem;
                        border-radius: 8px;
                        font-family: 'Orbitron', sans-serif;
                        font-weight: 700;
                        font-size: 1rem;
                        cursor: pointer;
                        margin-top: 1rem;
                        text-transform: uppercase;
                    ">Got it!</button>
                `;

            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'acceptedNotificationOverlay';
            overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 9999;
                `;

            document.body.appendChild(overlay);
            document.body.appendChild(popup);
            const closeBtn = popup.querySelector('.accepted-notification-close');
            if (closeBtn) closeBtn.addEventListener('click', closeAcceptedNotification);
        }

        // Close the accepted notification popup
        function closeAcceptedNotification() {
            const popup = document.getElementById('acceptedNotification');
            const overlay = document.getElementById('acceptedNotificationOverlay');
            if (popup) popup.remove();
            if (overlay) overlay.remove();
        }

        // Modal functions
        function openRequestModal(tutorId, tutorName = '') {
            console.log('🎯 Opening request modal...');
            const modal = document.getElementById('requestModal');
            const tutorIdInput = document.getElementById('selectedTutorId');
            const tutorNotice = document.getElementById('selectedTutorNotice');
            console.log('Modal element:', modal);
            if (modal) {
                if (tutorId) {
                    tutorIdInput.value = tutorId;
                    tutorNotice.style.display = 'block';
                    tutorNotice.textContent = `Tutor selected: ${tutorName || 'Specific tutor'} (request will be sent to this tutor).`;
                } else {
                    tutorIdInput.value = '';
                    tutorNotice.style.display = 'none';
                    tutorNotice.textContent = '';
                }
                modal.classList.add('active');
                console.log('✅ Modal opened');
            } else {
                console.error('❌ Modal element not found!');
            }
        }

        function closeRequestModal() {
            console.log('🎯 Closing request modal...');
            const modal = document.getElementById('requestModal');
            if (modal) {
                modal.classList.remove('active');
            }
        }

        function closeRequestDropdown() {
            const panel = document.getElementById('requestPanel');
            if (panel) panel.open = false;
        }

        function openQuickRequestForTutor(tutorId, tutorName) {
            const panel = document.getElementById('requestPanel');
            const tutorIdInput = document.getElementById('quickSelectedTutorId');
            const tutorNotice = document.getElementById('quickSelectedTutorNotice');
            if (panel) {
                panel.open = true;
            }
            tutorIdInput.value = tutorId || '';
            if (tutorId) {
                tutorNotice.style.display = 'block';
                tutorNotice.textContent = `Request will be sent to: ${tutorName}`;
            } else {
                tutorNotice.style.display = 'none';
                tutorNotice.textContent = '';
            }
            const dropdown = document.getElementById('requestDropdown');
            if (dropdown) dropdown.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function showQuickRequestStatus(message, type = 'success') {
            showToast(message, type);
        }

        async function submitQuickRequest() {
            const subject = document.getElementById('quickRequestSubject').value;
            const requestedTime = document.getElementById('quickRequestTime').value;
            const description = document.getElementById('quickRequestDescription').value;
            const selectedTutorId = document.getElementById('quickSelectedTutorId').value;

            if (!subject || !requestedTime) {
                showQuickRequestStatus('Please select both subject and hours.', 'error');
                return;
            }

            // Disable send button to prevent double-clicks
            const sendBtn = document.getElementById('sendRequestBtn');
            if (sendBtn) {
                sendBtn.disabled = true;
                sendBtn.textContent = 'Sending...';
            }

            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    showQuickRequestStatus('You are logged out. Please log in again.', 'error');
                    if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'Send Request'; }
                    setTimeout(() => { window.location.href = 'login.html'; }, 900);
                    return;
                }

                const res = await fetch(`${API_URL}/tutor/create-request`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        subject,
                        requestedTime,
                        description,
                        priority: 'medium',
                        selectedTutorId
                    })
                });
                const data = await res.json();
                if (!data.success) {
                    showQuickRequestStatus(data.error || 'Request failed. Please try again.', 'error');
                    if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'Send Request'; }
                    return;
                }

                // Close the request panel
                const panel = document.getElementById('requestPanel');
                if (panel) panel.open = false;

                // Reset form fields
                document.getElementById('quickRequestSubject').value = '';
                document.getElementById('quickRequestTime').value = '';
                document.getElementById('quickRequestDescription').value = '';
                document.getElementById('quickSelectedTutorId').value = '';
                const tutorNotice = document.getElementById('quickSelectedTutorNotice');
                tutorNotice.style.display = 'none';
                tutorNotice.textContent = '';

                // Re-enable send button
                if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'Send Request'; }

                // Show the inline "Request Sent" banner
                const banner = document.getElementById('requestSentBanner');
                if (banner) {
                    banner.classList.add('show');
                    // Auto-hide the banner after 3 seconds
                    setTimeout(() => {
                        banner.classList.remove('show');
                    }, 3000);
                }

                // Also show toast
                showToast('✅ Request sent! Check your email for updates.', 'success');

                loadDashboard();
            } catch (error) {
                showQuickRequestStatus('Error submitting request: ' + error.message, 'error');
                if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'Send Request'; }
            }
        }

        // Close modal when clicking outside
        document.addEventListener('click', function (event) {
            const modal = document.getElementById('requestModal');
            if (event.target === modal) {
                closeRequestModal();
            }
        });

        // Submit new request
        async function submitRequest(event) {
            if (event && event.preventDefault) event.preventDefault();

            const subject = document.getElementById('requestSubject').value;
            const description = document.getElementById('requestDescription').value;
            const priority = document.getElementById('requestPriority').value;
            const requestedTime = document.getElementById('requestTime').value;
            const selectedTutorId = document.getElementById('selectedTutorId').value;

            console.log('📝 Submitting request:', { subject, description, priority, requestedTime });

            if (!subject) {
                alert('❌ Please select a subject');
                return;
            }

            if (!requestedTime) {
                alert('❌ Please select a session duration');
                return;
            }

            try {
                const token = localStorage.getItem('authToken');
                const url = `${API_URL}/tutor/create-request`;

                console.log('📍 Posting to:', url);

                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ subject, description, priority, requestedTime, selectedTutorId })
                });

                console.log('📡 Response status:', res.status);

                const data = await res.json();
                console.log('📦 Response data:', data);

                if (data.success) {
                    console.log('✅ Request submitted successfully!');
                    alert('✅ Request submitted! Tutors will be notified.');
                    closeRequestModal();

                    // Clear form
                    document.getElementById('requestSubject').value = '';
                    document.getElementById('requestDescription').value = '';
                    document.getElementById('requestPriority').value = 'medium';
                    document.getElementById('requestTime').value = '';
                    document.getElementById('selectedTutorId').value = '';
                    const tutorNotice = document.getElementById('selectedTutorNotice');
                    tutorNotice.style.display = 'none';
                    tutorNotice.textContent = '';

                    // Reload dashboard
                    loadDashboard();
                } else {
                    console.error('❌ Server error:', data.error);
                    alert('❌ Error: ' + (data.error || 'Failed to submit request'));
                }
            } catch (error) {
                console.error('❌ Error submitting request:', error);
                alert('❌ Error submitting request: ' + error.message);
            }
        }

        // Navigation
        function logout() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }

        // Load dashboard on page load
        document.addEventListener('DOMContentLoaded', function () {
            console.log('✅ Page loaded, initializing...');

            const user = getUser();
            console.log('🔍 Debug Info:');
            console.log('User:', user);
            console.log('API_URL:', API_URL);

            if (!user || user.userType !== 'student') {
                console.error('❌ Not a student, redirecting...');
                window.location.href = 'login.html';
                return;
            }

            // Set student name
            const studentNameEl = document.getElementById('studentName');
            if (studentNameEl) {
                studentNameEl.textContent = user.firstName;
            }

            const logoutBtn = document.getElementById('studentLogoutBtn');
            if (logoutBtn) logoutBtn.addEventListener('click', logout);
            const qOpen = document.getElementById('quickInlineOpenBtn');
            if (qOpen) {
                qOpen.addEventListener('click', () => {
                    const m = document.getElementById('quickInlineRequestModal');
                    if (m) m.style.display = 'flex';
                });
            }
            const qSend = document.getElementById('quickInlineSendBtn');
            if (qSend) qSend.addEventListener('click', submitQuickInlineRequest);
            const qCancel = document.getElementById('quickInlineCancelBtn');
            if (qCancel) {
                qCancel.addEventListener('click', () => {
                    const m = document.getElementById('quickInlineRequestModal');
                    if (m) m.style.display = 'none';
                });
            }
            const rmClose = document.getElementById('requestModalCloseBtn');
            if (rmClose) rmClose.addEventListener('click', closeRequestModal);
            const rmCancel = document.getElementById('requestModalCancelBtn');
            if (rmCancel) rmCancel.addEventListener('click', closeRequestModal);
            const rmForm = document.getElementById('requestModalForm');
            if (rmForm) rmForm.addEventListener('submit', submitRequest);

            // Load available subjects for dropdowns
            loadAvailableSubjects();

            // Load dashboard data
            loadDashboard();

            // Refresh data every 30 seconds
            setInterval(loadDashboard, 30000);
        });

        console.log('✅ Scripts loaded successfully');
