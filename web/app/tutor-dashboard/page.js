"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const TIME_LABELS = { "30min": "30 minutes", "1hour": "1 hour", "1.5hours": "1.5 hours", "2hours": "2 hours" };
const ADMIN_EMAIL = "dylanduancanada@gmail.com";

export default function TutorDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ sessionsCompleted: 0, hoursTaught: 0 });
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  const token = () => localStorage.getItem("authToken");

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/tutor/stats", { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.success) setStats({ sessionsCompleted: data.sessionsCompleted || 0, hoursTaught: data.hoursTaught || 0 });
      else console.error("Stats fetch error:", data.error || res.status);
    } catch (e) { console.error("Stats fetch exception:", e.message); }
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/tutor/requests", { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.success) setRequests(data.requests || []);
      else console.error("Requests fetch error:", data.error || res.status);
    } catch (e) { console.error("Requests fetch exception:", e.message); }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/tutor/sessions", { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.success) {
        const rendered = (data.sessions || []).filter((s) => ["completed", "scheduled", "in-progress"].includes(s.status));
        setSessions(rendered);
      } else console.error("Sessions fetch error:", data.error || res.status);
    } catch (e) { console.error("Sessions fetch exception:", e.message); }
  }, []);

  const loadDashboard = useCallback(() => {
    loadStats(); loadRequests(); loadSessions();
  }, [loadStats, loadRequests, loadSessions]);

useEffect(() => {
    const raw = localStorage.getItem("user");
    let u = raw ? JSON.parse(raw) : null;
    if (!u) { router.push("/login"); return; }

    // Re-fetch profile to get latest approval status
    (async () => {
      try {
        const res = await fetch("/api/auth/profile", { headers: { Authorization: `Bearer ${token()}` } });
        if (res.ok) {
          const pd = await res.json();
          if (pd.success && pd.user) {
            u = { id: pd.user._id, firstName: pd.user.firstName, lastName: pd.user.lastName, email: pd.user.email, userType: pd.user.userType, tutorApplication: pd.user.tutorApplication, tutorProfile: pd.user.tutorProfile };
            localStorage.setItem("user", JSON.stringify(u));
          }
        }
      } catch (e) { console.error("Profile refresh failed:", e.message); }

      if (u.email !== ADMIN_EMAIL) {
        if (u.userType !== "tutor") {
          router.push("/login");
          return;
        }
        const appStatus = u.tutorApplication?.status;
        if (appStatus !== "approved") {
          router.push(appStatus === "pending" ? "/tutor-pending" : "/login");
          return;
        }
      }
      setUser(u);
      loadDashboard();
    })();

    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, [router, loadDashboard]);

  async function acceptRequest(requestId) {
    try {
      const res = await fetch("/api/tutor/accept-request", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Request accepted! Check your email for the meeting link. The student received the same link.");
        loadDashboard();
      } else {
        alert("❌ Error: " + (data.error || data.message || "Failed to accept request"));
      }
    } catch (e) { alert("❌ Error: " + e.message); }
  }

  async function completeSession(sessionId) {
    try {
      const res = await fetch("/api/tutor/complete-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ Session completed! Hours have been logged automatically.");
        loadDashboard();
      } else {
        alert("❌ Error: " + (data.error || "Failed to complete session"));
      }
    } catch (e) { alert("❌ Error: " + e.message); }
  }

  function doLogout() {
    localStorage.removeItem("authToken"); localStorage.removeItem("user");
    router.push("/");
  }

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <>
      <div className="dash-mesh-gradient"></div>
      <div className="container" style={{ padding: "2rem", position: "relative", zIndex: 10 }}>
        <div className="header">
          <div className="header-content">
            <h1>⚡ Welcome, <span>{user?.firstName || "Tutor"}</span>!</h1>
            <p>Accept student requests and teach on Zoom</p>
          </div>
          <div className="header-actions">
            {isAdmin && (
              <button type="button" className="btn-secondary" onClick={() => router.push("/admin-applications")}>
                👨‍💼 Admin Panel
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={doLogout}>🚪 Logout</button>
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", borderBottom: "2px solid rgba(255,255,255,0.1)", paddingBottom: "0" }}>
          {[{ id: "dashboard", label: "📊 Dashboard" }, { id: "guide", label: "📖 How to Use" }].map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              style={{ padding: "0.75rem 1.5rem", background: "none", border: "none", borderBottom: activeTab === tab.id ? "3px solid #c8932a" : "3px solid transparent", color: activeTab === tab.id ? "#c8932a" : "#9ca3af", fontWeight: activeTab === tab.id ? 700 : 500, fontSize: "1rem", cursor: "pointer", fontFamily: "inherit", marginBottom: "-2px", transition: "all 0.2s" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "guide" && (
          <div style={{ maxWidth: "760px" }}>
            <h2 style={{ color: "#c8932a", marginBottom: "0.5rem", fontSize: "1.75rem" }}>Tutor Guide</h2>
            <p style={{ color: "#9ca3af", marginBottom: "2rem" }}>Everything you need to know about tutoring on Saint Thunderbird.</p>

            {[
              {
                icon: "✅", title: "Step 1 — Get Approved",
                items: [
                  "Submit a tutor application from the home page.",
                  "An admin reviews your application and approves or denies it.",
                  "Once approved, you gain access to this dashboard and will start receiving student requests.",
                ]
              },
              {
                icon: "📝", title: "Step 2 — Accepting Student Requests",
                items: [
                  "Students post requests for help in specific subjects.",
                  "You'll receive an email notification when a new matching request comes in.",
                  "In the Dashboard tab, scroll to Student Requests and click ✅ Accept Request & Generate Zoom Meeting.",
                  "Accepting instantly creates a unique Zoom meeting — both you and the student are emailed the link automatically.",
                  "Each session gets its own distinct Zoom link, so there's never any overlap between students.",
                ]
              },
              {
                icon: "▶", title: "Step 3 — Running the Session",
                items: [
                  "Join the meeting using the link emailed to you or shown on your dashboard.",
                  "Tutor your student as normal.",
                  "When the session ends, click ✅ Mark Session Complete on the session card.",
                  "Hours are automatically logged based on the duration the student originally requested.",
                ]
              },
              {
                icon: "⏱️", title: "Step 4 — Volunteer Hours",
                items: [
                  "Every hour you tutor counts as a volunteer hour.",
                  "Your total hours are tracked automatically and shown in your stats.",
                  "To get your hours officially confirmed for external records, email dylanduancanada@gmail.com.",
                  "You receive a summary of your hours in the weekly report every Monday.",
                ]
              },
              {
                icon: "📊", title: "Weekly Reports",
                items: [
                  "Every Monday morning, the admin receives a report showing every tutor's hours for the past week.",
                  "Your name, email, sessions completed this week, and total all-time hours are included.",
                  "This is how your volunteer hours are tracked over time.",
                ]
              },
              {
                icon: "❓", title: "Need Help?",
                items: [
                  "For any issues with the platform, email dylanduancanada@gmail.com.",
                  "If a student doesn't show up or there's a Zoom issue, end the session normally and note it in your email.",
                  "Sessions auto-refresh every 30 seconds, so new requests appear without needing to reload the page.",
                ]
              },
            ].map((section) => (
              <div key={section.title} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "1.5rem", marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#e5e7eb", marginBottom: "1rem" }}>{section.icon} {section.title}</div>
                <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {section.items.map((item, i) => (
                    <li key={i} style={{ color: "#d1d5db", lineHeight: 1.6 }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {activeTab === "dashboard" && <>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎓</div>
            <div className="stat-value">{stats.sessionsCompleted}</div>
            <div className="stat-label">Completed Sessions</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-value">{stats.hoursTaught}</div>
            <div className="stat-label">Hours Taught</div>
          </div>
        </div>

        <div style={{ background: "rgba(34,197,94,0.2)", border: "2px solid rgba(34,197,94,0.5)", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem", color: "#22c55e", fontWeight: 600, fontSize: "1.1rem", textAlign: "center" }}>
          👥 <strong>Free Volunteer Hours Available!</strong><br />
          For every hour you tutor, you earn free volunteer hours. Email dylanduancanada@gmail.com to get your volunteer hours confirmed and added to your record.<br />
          <a href="/volunteer-hours-guide" style={{ display: "inline-block", marginTop: "1rem", padding: "0.75rem 1.5rem", background: "rgba(212,165,116,0.1)", color: "var(--beige)", border: "1px solid var(--border)", borderRadius: "8px", textDecoration: "none", fontWeight: 700 }}>
            📚 Learn More
          </a>
        </div>

        <div className="zoom-info">
          🎥 When you accept a request, a unique meeting link is automatically created and emailed to both you and the student. When the session is done, click <strong>✅ Mark Session Complete</strong> — hours are logged based on the time the student originally requested.
        </div>

        <div className="card">
          <div className="card-title">📝 Student Requests</div>
          {requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-text">No student requests yet</div>
              <div className="empty-state-subtext">Students will appear here when they request help in your subjects</div>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req._id} className="student-request-card" style={{ marginBottom: "1.5rem" }}>
                <div className="student-name">{req.studentName}</div>
                <div className="student-subject">{req.subject || "General"}</div>
                <div className="request-info">
                  <div className="info-item">
                    <div className="info-label">Student email</div>
                    <div className="info-value" style={{ fontSize: "0.9rem" }}>{req.studentEmail || ""}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Duration</div>
                    <div className="info-value" style={{ fontSize: "0.9rem" }}>{TIME_LABELS[req.requestedTime] || req.requestedTime || "—"}</div>
                  </div>
                </div>
                <p style={{ color: "#ccc", fontSize: "0.9rem", margin: "0.75rem 0" }}>{req.description || ""}</p>
                <button type="button" className="accept-btn" onClick={() => acceptRequest(req._id)}>
                  ✅ Accept Request &amp; Generate Meeting Link
                </button>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="card-title">✅ Completed Sessions</div>
          {sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">No sessions yet</div>
              <div className="empty-state-subtext">Accepted and completed sessions will appear here</div>
            </div>
          ) : (
            sessions.map((session) => {
              const isCompleted = session.status === "completed";
              return (
                <div key={session._id} className="student-request-card" style={{ marginBottom: "1.5rem" }}>
                  <div className="student-name">{session.studentName || "Unknown Student"}</div>
                  <div className="student-subject">{session.subject || "General"}</div>
                  <div className="request-info">
                    <div className="info-item">
                      <div className="info-label">Student Email</div>
                      <div className="info-value" style={{ fontSize: "0.9rem" }}>{session.studentEmail || "N/A"}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Scheduled Time</div>
                      <div className="info-value" style={{ fontSize: "0.9rem" }}>{new Date(session.scheduledTime).toLocaleString()}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Status</div>
                      <div className="info-value" style={{ fontSize: "0.9rem" }}>{isCompleted ? "Completed ✅" : "Upcoming 🗓️"}</div>
                    </div>
                  </div>
                  {session.zoomLink && (
                    <div style={{ background: "rgba(59,130,246,0.2)", border: "2px solid rgba(59,130,246,0.5)", padding: "1rem", borderRadius: "8px", margin: "1rem 0", textAlign: "center" }}>
                      <p style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}><strong>Meeting ID:</strong> {session.zoomMeetingId || "N/A"}</p>
                      <a href={session.zoomLink} target="_blank" rel="noreferrer" style={{ display: "inline-block", background: "linear-gradient(135deg,#60a5fa,#3b82f6)", color: "white", padding: "0.75rem 1.5rem", borderRadius: "8px", textDecoration: "none", fontWeight: 700 }}>
                        🎥 Join Meeting
                      </a>
                    </div>
                  )}
                  {isCompleted ? (
                    <div style={{ background: "rgba(34,197,94,0.2)", border: "2px solid rgba(34,197,94,0.5)", padding: "1rem", borderRadius: "8px", textAlign: "center", color: "#22c55e", fontWeight: 600 }}>
                      ✅ Session Completed{session.completedAt ? ` on ${new Date(session.completedAt).toLocaleString()}` : ""}
                      {session.hoursSpent ? ` — ${session.hoursSpent} hr(s) logged` : ""}
                    </div>
                  ) : (
                    <button type="button" className="accept-btn" style={{ marginTop: "1rem", background: "linear-gradient(135deg,#22c55e,#16a34a)" }} onClick={() => completeSession(session._id)}>
                      ✅ Mark Session Complete
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
        </>}
      </div>
    </>
  );
}
