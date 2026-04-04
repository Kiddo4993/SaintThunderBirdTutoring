"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const SUBJECTS = [
  { name: "Mathematics", icon: "📐" },
  { name: "Sciences", icon: "🔬" },
  { name: "Languages", icon: "🌐" },
  { name: "Social Studies", icon: "📚" },
  { name: "Technology", icon: "💻" },
  { name: "Arts & Culture", icon: "🎨" },
];

const EMAIL_PREFS = [
  "Tutor Acceptance Alerts",
  "Session Reminders",
  "Learning Tips & Resources",
  "Progress Updates",
  "Platform Updates",
];

export default function StudentProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [selectedInterests, setSelectedInterests] = useState(new Set());
  const [gradeLevel, setGradeLevel] = useState("");
  const [emailToggles, setEmailToggles] = useState([true, true, true, true, true]);
  const [stats, setStats] = useState({ requests: 0, tutors: 0, sessions: 0, hours: 0 });
  const [requests, setRequests] = useState([]);

  const token = () => localStorage.getItem("authToken");

  const loadData = useCallback(async () => {
    try {
      const [tutorsRes, reqRes] = await Promise.all([
        fetch("/api/tutor/available-tutors", { headers: { Authorization: `Bearer ${token()}` } }),
        fetch("/api/tutor/my-requests", { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      const [tutorsData, reqData] = await Promise.all([tutorsRes.json(), reqRes.json()]);
      setStats((prev) => ({ ...prev, tutors: tutorsData.tutors?.length || 0 }));
      if (reqData.success) {
        setRequests(reqData.requests || []);
        setStats((prev) => ({ ...prev, requests: reqData.requests?.length || 0 }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    const u = raw ? JSON.parse(raw) : null;
    if (!u || u.userType !== "student") { router.push("/login"); return; }
    setUser(u);
    if (u.interests?.length) setSelectedInterests(new Set(u.interests));
    if (u.grade) setGradeLevel(u.grade);
    loadData();
  }, [router, loadData]);

  function toggleInterest(name) {
    setSelectedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  function toggleEmail(i) {
    setEmailToggles((prev) => { const next = [...prev]; next[i] = !next[i]; return next; });
  }

  async function savePreferences() {
    try {
      const res = await fetch("/api/tutor/update-student-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ interests: Array.from(selectedInterests), grade: gradeLevel }),
      });
      const data = await res.json();
      if (data.success) alert("✅ Preferences saved successfully!");
      else alert("❌ Error: " + data.error);
    } catch (e) { alert("Error: " + e.message); }
  }

  function doLogout() {
    localStorage.removeItem("authToken"); localStorage.removeItem("user");
    router.push("/login");
  }

  return (
    <>
      <div className="mesh-gradient"></div>
      <div className="container" style={{ padding: "2rem", position: "relative", zIndex: 10 }}>
        <div className="header">
          <div className="header-content">
            <h1>⚡ Welcome, <span>{user?.firstName || "Student"}</span>!</h1>
            <p>Your student profile &amp; learning preferences</p>
          </div>
          <div className="header-actions">
            <button type="button" className="btn-secondary" onClick={() => router.push("/student-dashboard")}>📚 Go to Dashboard</button>
            <button type="button" className="btn-secondary" onClick={doLogout}>🚪 Logout</button>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="welcome-badge">👋 Welcome to Saint Thunderbird</div>
            <div className="card-title">🎓 Start Your Learning Journey</div>
            <div className="info-box">
              <p>Welcome to Saint Thunderbird Tutoring! A free, volunteer-powered tutoring platform dedicated to helping First Nations students succeed. Select your learning interests and let us find the perfect tutor for you.</p>
            </div>
            <div style={{ background: "rgba(212,165,116,0.05)", padding: "1rem", borderRadius: "8px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "0.75rem" }}><strong>📧 Email Notifications:</strong></p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>We&apos;ll send you emails when:</p>
              <ul style={{ listStyle: "none", marginTop: "0.5rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                <li>✓ A tutor accepts your request</li>
                <li>✓ Your session is confirmed</li>
                <li>✓ Important learning tips &amp; resources</li>
                <li>✓ Session reminders and updates</li>
              </ul>
            </div>
          </div>

          <div>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value">{stats.requests}</div><div className="stat-label">Requests</div></div>
              <div className="stat-card"><div className="stat-value">{stats.tutors}</div><div className="stat-label">Tutors</div></div>
              <div className="stat-card"><div className="stat-value">{stats.sessions}</div><div className="stat-label">Sessions</div></div>
              <div className="stat-card"><div className="stat-value">{stats.hours}</div><div className="stat-label">Hours</div></div>
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-title">📖 Learning Interests</div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Select the subjects you&apos;d like to focus on. This helps us match you with the right tutors.</p>
            <div className="interests-grid">
              {SUBJECTS.map(({ name, icon }) => (
                <div key={name} className={`interest-item${selectedInterests.has(name) ? " selected" : ""}`} onClick={() => toggleInterest(name)}>
                  <div className="interest-checkmark">✓</div>
                  <div className="interest-icon">{icon}</div>
                  <div className="interest-name">{name}</div>
                </div>
              ))}
            </div>
            <div className="grade-section">
              <div className="grade-label">📚 Your Grade Level</div>
              <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}>
                <option value="">Select your grade level</option>
                <option value="elementary">Elementary (K-5)</option>
                <option value="middle">Middle School (6-8)</option>
                <option value="high">High School (9-12)</option>
                <option value="post-secondary">Post-Secondary</option>
              </select>
            </div>
            <button type="button" className="save-btn" onClick={savePreferences}>Save Preferences</button>
          </div>

          <div className="card">
            <div className="card-title">📧 Email Preferences</div>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Control how and when you receive notifications from Saint Thunderbird.</p>
            <div className="email-settings">
              {EMAIL_PREFS.map((label, i) => (
                <div key={label} className="email-setting-item">
                  <div className="email-setting-label">{label}</div>
                  <div className={`toggle-switch${emailToggles[i] ? " active" : ""}`} role="button" tabIndex={0}
                    onClick={() => toggleEmail(i)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleEmail(i); } }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">📝 Your Tutoring Requests</div>
          <div className="tutoring-requests">
            {requests.length === 0 ? (
              <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem" }}>
                <p>No active requests yet. Head to the dashboard to submit your first tutoring request!</p>
              </div>
            ) : (
              requests.map((req) => (
                <div key={req._id} className="request-item">
                  <div className="request-header">
                    <div className="request-subject">{req.subject}</div>
                    <div className={`request-status ${req.status}`}>{req.status.toUpperCase()}</div>
                  </div>
                  <div className="request-message">{req.description || "No description provided"}</div>
                  <div className="request-time">{new Date(req.createdAt).toLocaleDateString()}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
