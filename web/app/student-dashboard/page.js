"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const TIME_LABELS = { "30min": "30 minutes", "1hour": "1 hour", "1.5hours": "1.5 hours", "2hours": "2 hours" };

export default function StudentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ requestsMade: 0, completedSessions: 0, hoursLearned: 0 });
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [quickSubject, setQuickSubject] = useState("");
  const [quickHours, setQuickHours] = useState("");
  const [reqSubject, setReqSubject] = useState("");
  const [reqDescription, setReqDescription] = useState("");
  const [reqTime, setReqTime] = useState("");
  const [reqPriority, setReqPriority] = useState("medium");
  const [toast, setToast] = useState(null);
  const [requestSentVisible, setRequestSentVisible] = useState(false);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const loadStats = useCallback(async (token) => {
    try {
      const res = await fetch("/api/tutor/student-stats", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setStats({ requestsMade: data.requestsMade || 0, completedSessions: data.completedSessions || 0, hoursLearned: data.hoursLearned || 0 });
    } catch {}
  }, []);

  const loadRequests = useCallback(async (token) => {
    try {
      const res = await fetch("/api/tutor/my-requests", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setRequests(data.requests || []);
    } catch {}
  }, []);

  const loadSessions = useCallback(async (token) => {
    try {
      const res = await fetch("/api/tutor/student-sessions", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSessions(data.sessions || []);
    } catch {}
  }, []);

  const loadDashboard = useCallback(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    loadStats(token);
    loadRequests(token);
    loadSessions(token);
  }, [loadStats, loadRequests, loadSessions]);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    const u = raw ? JSON.parse(raw) : null;
    if (!u || u.userType !== "student") { router.push("/login"); return; }
    setUser(u);
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, [router, loadDashboard]);

  async function submitQuickRequest() {
    if (!quickSubject || !quickHours) { alert("Please select both a subject and hours."); return; }
    const hourToTime = { "0.5": "30min", "1": "1hour", "1.5": "1.5hours", "2": "2hours" };
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch("/api/tutor/create-request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: quickSubject, requestedTime: hourToTime[quickHours], description: "", priority: "medium" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowQuickModal(false);
        setQuickSubject(""); setQuickHours("");
        setRequestSentVisible(true);
        setTimeout(() => setRequestSentVisible(false), 3000);
        showToast("✅ Request sent! Check your email for updates.");
        loadDashboard();
      } else {
        alert(data.error || "Error sending request");
      }
    } catch (e) { alert("Error: " + e.message); }
  }

  async function submitRequestModal(e) {
    e.preventDefault();
    if (!reqSubject) { alert("❌ Please select a subject"); return; }
    if (!reqTime) { alert("❌ Please select a session duration"); return; }
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch("/api/tutor/create-request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: reqSubject, description: reqDescription, priority: reqPriority, requestedTime: reqTime }),
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Request submitted! Tutors will be notified.");
        setShowRequestModal(false);
        setReqSubject(""); setReqDescription(""); setReqTime(""); setReqPriority("medium");
        loadDashboard();
      } else {
        alert("❌ Error: " + (data.error || "Failed to submit request"));
      }
    } catch (e) { alert("❌ Error: " + e.message); }
  }

  function doLogout() {
    localStorage.removeItem("authToken"); localStorage.removeItem("user");
    router.push("/login");
  }

  return (
    <>
      <div className="mesh-gradient"></div>
      {toast && <div className={`toast-notification ${toast.type}`}>{toast.message}</div>}

      <div className="container" style={{ padding: "2rem", position: "relative", zIndex: 10 }}>
        <div className="header">
          <div className="header-content">
            <h1>⚡ Welcome, <span>{user?.firstName || "Student"}</span>!</h1>
            <p>Request tutoring help and get connected with tutors</p>
          </div>
          <div className="header-actions">
            <button type="button" className="btn-secondary" onClick={doLogout}>🚪 Logout</button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-value">{stats.requestsMade}</div>
            <div className="stat-label">Requests Made</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{stats.completedSessions}</div>
            <div className="stat-label">Completed Sessions</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-value">{stats.hoursLearned}</div>
            <div className="stat-label">Hours Learned</div>
          </div>
          <button type="button" onClick={() => setShowQuickModal(true)}
            style={{ gridColumn: "1/-1", width: "100%", padding: "16px", background: "#c8932a", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", fontFamily: "inherit" }}>
            ⚡ REQUEST TUTORING HELP
          </button>
        </div>

        {requestSentVisible && (
          <div className="request-sent-banner show">
            <div className="banner-icon">✅</div>
            <div className="banner-title">Request Sent!</div>
            <div className="banner-subtitle">A tutor will be notified and contact you via email with session details.</div>
          </div>
        )}

        <div style={{ background: "rgba(59,130,246,0.2)", border: "2px solid rgba(59,130,246,0.5)", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem", color: "#60a5fa", fontWeight: 600, fontSize: "1.1rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            🎥 <strong>How It Works:</strong><br />
            1. Submit a tutoring request below<br />
            2. A tutor will accept your request<br />
            3. Both you and the tutor will receive an email with each other&apos;s contact info<br />
            4. The tutor will email you a Zoom or Google Meet link for your session!
          </div>
          <div style={{ borderTop: "2px solid rgba(59,130,246,0.5)", paddingTop: "1rem" }}>
            💻 <strong>Requirements:</strong> You need a computer with Zoom or Google Meet installed, plus a working microphone and camera.
          </div>
        </div>

        <div style={{ background: "rgba(239,68,68,0.2)", border: "2px solid rgba(239,68,68,0.5)", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem", color: "#ef4444", fontWeight: 600, fontSize: "1.1rem", textAlign: "center" }}>
          📞 <strong>Need Help?</strong><br />
          If you feel like the tutoring isn&apos;t working well or if you experience any difficulties, please contact us at:<br />
          <strong style={{ fontSize: "1.2rem", display: "block", marginTop: "0.5rem" }}>📧 dylanduancanada@gmail.com</strong>
        </div>

        <div className="card">
          <div className="card-title">📝 Your Requests</div>
          {requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📖</div>
              <div className="empty-state-text">No requests yet</div>
              <div className="empty-state-subtext">Create your first request to find a tutor!</div>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req._id} className="request-card">
                <div className="request-subject">{req.subject}</div>
                <span className={`request-status status-${req.status}`}>{req.status.toUpperCase()}</span>
                <div className="request-description">&quot;{req.description || "No additional details provided"}&quot;</div>
                <div style={{ fontSize: "0.9rem", color: "var(--beige)", margin: "0.75rem 0", fontWeight: 600 }}>
                  ⏱️ Duration: {TIME_LABELS[req.requestedTime] || req.requestedTime || "Not specified"}
                </div>
                <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                  📅 Submitted: {new Date(req.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-title">🎓 Your Sessions</div>
          <div className="tutors-grid">
            {sessions.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                <div className="empty-state-icon">🎓</div>
                <div className="empty-state-text">No upcoming sessions</div>
                <div className="empty-state-subtext">When a tutor accepts your request, it will appear here.</div>
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session._id} className="session-card">
                  <div>
                    <div className="session-header" style={{ flexDirection: "column", alignItems: "start", gap: "0.5rem" }}>
                      <div className="tutor-name">{session.tutorName}</div>
                      <div className="session-time" style={{ fontSize: "0.85rem", alignSelf: "flex-start" }}>{new Date(session.scheduledTime).toLocaleString()}</div>
                    </div>
                    <div className="session-subject">{session.subject}</div>
                    <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: "bold" }}>Status: {session.status}</div>
                  </div>
                  {session.zoomLink ? (
                    <div style={{ marginTop: "1rem" }}>
                      <a href={session.zoomLink} target="_blank" rel="noreferrer" className="btn-primary" style={{ display: "inline-block", textDecoration: "none", textAlign: "center", fontSize: "0.8rem", padding: "0.5rem 1rem" }}>Join Meeting</a>
                      {session.zoomMeetingId && <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "0.5rem" }}>Meeting ID: {session.zoomMeetingId}</div>}
                    </div>
                  ) : (
                    <div style={{ marginTop: "1rem", color: "#9ca3af", fontSize: "0.9rem" }}>Link will be emailed when tutor starts session</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Request Modal */}
      {showQuickModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#1a1a1a", border: "1px solid #c8932a", borderRadius: "12px", padding: "32px", width: "90%", maxWidth: "420px" }}>
            <h3 style={{ color: "#c8932a", marginBottom: "20px" }}>Request Tutoring Help</h3>
            <label style={{ color: "#ccc", display: "block", marginBottom: "6px" }}>Subject</label>
            <select value={quickSubject} onChange={(e) => setQuickSubject(e.target.value)}
              style={{ width: "100%", padding: "10px", background: "#111", color: "#fff", border: "1px solid #444", borderRadius: "6px", marginBottom: "16px", fontFamily: "inherit" }}>
              <option value="">Select a subject...</option>
              <option>Mathematics</option>
              <option>English &amp; Literature</option>
              <option>Science</option>
              <option>Social Studies</option>
              <option>Computer Science</option>
              <option>Arts &amp; Culture</option>
            </select>
            <label style={{ color: "#ccc", display: "block", marginBottom: "6px" }}>Hours Requested</label>
            <select value={quickHours} onChange={(e) => setQuickHours(e.target.value)}
              style={{ width: "100%", padding: "10px", background: "#111", color: "#fff", border: "1px solid #444", borderRadius: "6px", marginBottom: "24px", fontFamily: "inherit" }}>
              <option value="">Select hours...</option>
              <option value="0.5">30 Minutes</option>
              <option value="1">1 Hour</option>
              <option value="1.5">1.5 Hours</option>
              <option value="2">2 Hours</option>
            </select>
            <div style={{ display: "flex", gap: "12px" }}>
              <button type="button" onClick={submitQuickRequest}
                style={{ flex: 1, padding: "12px", background: "#c8932a", color: "#000", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontFamily: "inherit" }}>
                Send Request
              </button>
              <button type="button" onClick={() => setShowQuickModal(false)}
                style={{ flex: 1, padding: "12px", background: "#333", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Request Modal */}
      {showRequestModal && (
        <div className="modal active" onClick={(e) => { if (e.target === e.currentTarget) setShowRequestModal(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <span>📝 Request Tutoring Help</span>
              <button type="button" className="close-btn" onClick={() => setShowRequestModal(false)}>×</button>
            </div>
            <form onSubmit={submitRequestModal}>
              <div className="form-group">
                <label>Subject</label>
                <select value={reqSubject} onChange={(e) => setReqSubject(e.target.value)} required>
                  <option value="">Select a subject</option>
                  <option value="Mathematics">Mathematics 📐</option>
                  <option value="Sciences">Sciences 🔬</option>
                  <option value="Languages">Languages 🌐</option>
                  <option value="Social Studies">Social Studies 📚</option>
                  <option value="Technology">Technology 💻</option>
                  <option value="Arts & Culture">Arts &amp; Culture 🎨</option>
                </select>
              </div>
              <div className="form-group">
                <label>What do you need help with? (Optional)</label>
                <textarea value={reqDescription} onChange={(e) => setReqDescription(e.target.value)}
                  placeholder="Tell the tutor what specific topics you need help with..."></textarea>
              </div>
              <div className="form-group">
                <label>Session Duration</label>
                <select value={reqTime} onChange={(e) => setReqTime(e.target.value)} required>
                  <option value="">Select duration</option>
                  <option value="30min">30 minutes</option>
                  <option value="1hour">1 hour</option>
                  <option value="1.5hours">1.5 hours</option>
                  <option value="2hours">2 hours</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={reqPriority} onChange={(e) => setReqPriority(e.target.value)} required>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
