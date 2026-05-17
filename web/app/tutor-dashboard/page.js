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
  const [volunteerSubmitting, setVolunteerSubmitting] = useState(false);

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

  async function submitVolunteerHours() {
    setVolunteerSubmitting(true);
    try {
      const res = await fetch("/api/tutor/submit-volunteer-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Volunteer hours submitted!\n\nPrevious: ${data.previousHours} hrs\nCurrent total: ${data.currentHours} hrs\nNew hours: ${data.newHours} hrs\n\nAn email has been sent to the admin.`);
      } else {
        alert("❌ Error: " + (data.error || "Failed to submit hours"));
      }
    } catch (e) { alert("❌ Error: " + e.message); }
    setVolunteerSubmitting(false);
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
                icon: "✅", title: "Step 1 — Getting Approved",
                items: [
                  "Submit a tutor application from the home page with your subjects, education level, and a short bio.",
                  "The admin reviews your application — you'll receive an email when you're approved or denied.",
                  "Once approved, you can log in and access this dashboard to start accepting students.",
                ]
              },
              {
                icon: "📥", title: "Step 2 — Accepting Student Requests",
                items: [
                  "Students submit requests for specific subjects and session durations (30 min to 2 hrs).",
                  "Open requests from students who need your subjects appear under Student Requests on the Dashboard tab.",
                  "Click ✅ Accept Request & Generate Meeting Link to accept.",
                  "This instantly creates a private meeting room — both you and the student receive the link by email.",
                  "Every session gets its own unique room, so sessions never overlap.",
                ]
              },
              {
                icon: "🎥", title: "Step 3 — Joining the Meeting",
                items: [
                  "Click the meeting link from your email or the Join Meeting button on your dashboard.",
                  "You will see a screen asking you to log in — click Log In and enter just your name (no account needed).",
                  "Joining first makes you the moderator, which lets the student enter the room.",
                  "Once you are in, the student can join using their own link.",
                ]
              },
              {
                icon: "⏹", title: "Step 4 — Completing the Session",
                items: [
                  "Tutor your student as normal over the meeting.",
                  "When the session ends, go to your dashboard and click ✅ Mark Session Complete on the session card.",
                  "Hours are automatically logged based on the duration the student originally requested — no manual entry needed.",
                  "The admin receives an email confirming the session was completed.",
                ]
              },
              {
                icon: "🏅", title: "Step 5 — Submitting Volunteer Hours",
                items: [
                  "Every completed session counts toward your official volunteer hours.",
                  "Your running total is always visible in your stats at the top of the dashboard.",
                  "When you want to officially record your hours (for school, college applications, etc.), click 📨 Send Volunteer Hours.",
                  "This sends the admin an email comparing your current total to your last submission, showing exactly how many new hours you've earned.",
                  "You can submit as often as you like — there's no limit.",
                ]
              },
              {
                icon: "❓", title: "Need Help?",
                items: [
                  "For any platform issues, email dylanduancanada@gmail.com.",
                  "If a student doesn't show up, still mark the session complete so your hours are logged.",
                  "The dashboard refreshes automatically every 30 seconds — new requests appear without reloading.",
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

        {/* Meeting Info Banner */}
        <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.08))", border: "1px solid rgba(99,102,241,0.35)", borderRadius: "14px", padding: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ fontWeight: 700, color: "#818cf8", fontSize: "1.05rem", marginBottom: "0.75rem" }}>🎥 How Sessions Work</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {[
              { icon: "1️⃣", text: "Accept a student request — a unique private meeting link is instantly created and emailed to both of you." },
              { icon: "2️⃣", text: "Click the meeting link and enter your name when prompted. This makes you the moderator so students can join." },
              { icon: "3️⃣", text: "The link is valid for the session's designated time (e.g. 1 hour) — after that it expires." },
              { icon: "4️⃣", text: "When you're done, click ✅ Mark Session Complete — hours are logged automatically based on what the student requested." },
            ].map(({ icon, text }) => (
              <div key={icon} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1rem", flexShrink: 0 }}>{icon}</span>
                <span style={{ color: "#c7d2fe", lineHeight: 1.6, fontSize: "0.95rem" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Volunteer Hours Section */}
        <div style={{ background: "linear-gradient(135deg, rgba(200,147,42,0.08), rgba(34,197,94,0.05))", border: "1px solid rgba(200,147,42,0.3)", borderRadius: "16px", padding: "2rem", marginBottom: "2rem" }}>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <div style={{ fontWeight: 800, color: "#c8932a", fontSize: "1.3rem", marginBottom: "0.25rem" }}>🏅 Volunteer Hours</div>
              <div style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Your tutoring time, officially tracked</div>
            </div>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <div style={{ textAlign: "center", background: "rgba(200,147,42,0.12)", border: "1px solid rgba(200,147,42,0.3)", borderRadius: "10px", padding: "0.75rem 1.25rem" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#c8932a" }}>{stats.hoursTaught}</div>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Hrs</div>
              </div>
              <div style={{ textAlign: "center", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", padding: "0.75rem 1.25rem" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#22c55e" }}>{stats.sessionsCompleted}</div>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sessions</div>
              </div>
            </div>
          </div>

          {/* Why it matters */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ color: "#e5e7eb", fontWeight: 600, marginBottom: "0.75rem", fontSize: "0.95rem" }}>Why your hours matter</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
              {[
                { icon: "🎓", label: "School & College", desc: "Fulfill community service requirements and strengthen college applications" },
                { icon: "💼", label: "Career & Resume", desc: "List tutoring as volunteer experience — valued by employers and grad programs" },
                { icon: "🤝", label: "Community Impact", desc: "Every hour directly helps First Nations students succeed academically" },
                { icon: "📄", label: "Official Docs", desc: "We provide official verification letters and hour breakdowns on request" },
              ].map(({ icon, label, desc }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "1rem" }}>
                  <div style={{ fontSize: "1.25rem", marginBottom: "0.4rem" }}>{icon}</div>
                  <div style={{ color: "#e5e7eb", fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.3rem" }}>{label}</div>
                  <div style={{ color: "#9ca3af", fontSize: "0.8rem", lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginBottom: "1.25rem" }} />

          {/* CTA */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ color: "#d1d5db", fontSize: "0.9rem", lineHeight: 1.6 }}>
                Click <strong style={{ color: "#c8932a" }}>Send Volunteer Hours</strong> to notify the admin of your current hours. The email shows your previous total vs. now — perfect for submitting to schools, employers, or for your own records. We will provide official documentation with additional info (dates, subjects, letter) anytime on request.
              </div>
            </div>
            <button type="button" onClick={submitVolunteerHours} disabled={volunteerSubmitting}
              style={{ padding: "0.9rem 2rem", background: volunteerSubmitting ? "#444" : "linear-gradient(135deg,#c8932a,#a87020)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "1rem", cursor: volunteerSubmitting ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap", boxShadow: "0 4px 15px rgba(200,147,42,0.3)" }}>
              {volunteerSubmitting ? "Sending..." : "📨 Send Volunteer Hours"}
            </button>
          </div>
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
