"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "dylanduancanada@gmail.com";

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [summary, setSummary] = useState({ pendingCount: 0, totalApplications: 0, approvedCount: 0 });
  const [applications, setApplications] = useState([]);

  const token = () => localStorage.getItem("authToken");

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/tutor/admin-summary", { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.success) setSummary({ pendingCount: data.pendingCount ?? 0, totalApplications: data.totalApplications ?? 0, approvedCount: data.approvedCount ?? 0 });
    } catch {}
  }, []);

  const loadApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/tutor/pending-applications", { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.success) setApplications(data.applications || []);
    } catch {}
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    const u = raw ? JSON.parse(raw) : null;
    if (!u || !token() || u.email !== ADMIN_EMAIL) {
      setAuthorized(false);
      return;
    }
    setAuthorized(true);
    setAdminEmail(u.email);
    loadSummary();
    loadApplications();
    const interval = setInterval(() => { loadSummary(); loadApplications(); }, 30000);
    return () => clearInterval(interval);
  }, [loadSummary, loadApplications]);

  async function approveApplication(userId, name) {
    if (!confirm(`Approve ${name}?`)) return;
    try {
      const res = await fetch(`/api/tutor/approve-tutor/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) { alert(`✅ ${name} has been approved!`); loadSummary(); loadApplications(); }
      else alert("❌ Error: " + data.error);
    } catch (e) { alert("❌ Network error: " + e.message); }
  }

  async function denyApplication(userId) {
    const reason = prompt("Enter denial reason (optional):");
    if (reason === null) return;
    try {
      const res = await fetch(`/api/tutor/deny-tutor/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) { alert("❌ Application denied"); loadSummary(); loadApplications(); }
      else alert("❌ Error: " + data.error);
    } catch (e) { alert("❌ Network error: " + e.message); }
  }

  function doLogout() {
    if (confirm("Logout?")) {
      localStorage.removeItem("authToken"); localStorage.removeItem("user");
      router.push("/");
    }
  }

  if (authorized === false) {
    return (
      <div className="unauthorized">
        <div className="unauthorized-content">
          <h1>❌ Unauthorized</h1>
          <p>You must be logged in as {ADMIN_EMAIL} to access the admin panel.</p>
          <button type="button" onClick={() => router.push("/login")} style={{ width: "100%", padding: "1rem" }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (authorized === null) return null;

  return (
    <div className="container" style={{ padding: "2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem", paddingBottom: "2rem", borderBottom: "1px solid rgba(212,165,116,0.3)" }}>
        <h1>🎓 Tutor Applications</h1>
        <div className="admin-info">
          <div className="admin-email">Admin: {adminEmail}</div>
          <button type="button" className="logout-btn" onClick={doLogout}>Logout</button>
        </div>
      </header>

      <div className="stats" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "2rem", marginBottom: "3rem" }}>
        <div className="stat-card"><div className="stat-number">{summary.pendingCount}</div><div className="stat-label">Pending Applications</div></div>
        <div className="stat-card"><div className="stat-number">{summary.totalApplications}</div><div className="stat-label">Total Applications</div></div>
        <div className="stat-card"><div className="stat-number">{summary.approvedCount}</div><div className="stat-label">Approved Tutors</div></div>
      </div>

      <div className="applications">
        {applications.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">✅</div>
            <p>No pending applications. All caught up!</p>
          </div>
        ) : (
          applications.map((app) => {
            const subjects = (app.tutorProfile?.subjects?.length > 0 ? app.tutorProfile.subjects : app.tutorApplication?.subjects) || [];
            const educationLevel = app.tutorProfile?.educationLevel || app.tutorApplication?.educationLevel || "Not specified";
            const experience = app.tutorProfile?.experience || app.tutorApplication?.experience || "Not provided";
            const motivation = app.tutorProfile?.motivation || app.tutorApplication?.motivation || "Not provided";
            const appliedAt = app.tutorApplication?.appliedAt || app.createdAt;
            const applicationName = app.tutorApplication?.name || `${app.firstName} ${app.lastName}`;
            const age = app.tutorApplication?.age || "Not provided";

            return (
              <div key={app._id} className="app-card">
                <div className="app-header">
                  <div>
                    <div className="app-name">{applicationName}</div>
                    <div className="app-email">{app.email}</div>
                  </div>
                  <span className="badge">⏳ Pending</span>
                </div>

                <div className="app-details">
                  <div className="detail">
                    <div className="detail-label">👤 Applicant Info</div>
                    <div className="detail-value"><strong>Account Name:</strong> {app.firstName} {app.lastName}</div>
                    <div className="detail-value"><strong>Age:</strong> {age}</div>
                  </div>
                  <div className="detail">
                    <div className="detail-label">📚 Subjects</div>
                    <div className="subjects">
                      {(subjects.length > 0 ? subjects : ["Not specified"]).map((s) => (
                        <span key={s} className="subject-tag">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="detail">
                    <div className="detail-label">🎓 Education Level</div>
                    <div className="detail-value">{educationLevel}</div>
                  </div>
                  <div className="detail">
                    <div className="detail-label">📅 Applied At</div>
                    <div className="detail-value">{appliedAt ? new Date(appliedAt).toLocaleString() : "Not available"}</div>
                  </div>
                  <div className="detail">
                    <div className="detail-label">🧾 Full Application Status</div>
                    <div className="detail-value">{app.tutorApplication?.status || "Unknown"}</div>
                    <div className="detail-value">Account Created: {app.createdAt ? new Date(app.createdAt).toLocaleString() : "Unknown"}</div>
                  </div>
                  <div className="detail" style={{ gridColumn: "1/-1" }}>
                    <div className="detail-label">💼 Experience</div>
                    <div className="experience-text">{experience}</div>
                  </div>
                  <div className="detail" style={{ gridColumn: "1/-1" }}>
                    <div className="detail-label">❤️ Motivation</div>
                    <div className="motivation-text">&quot;{motivation}&quot;</div>
                  </div>
                </div>

                <div className="app-actions">
                  <button type="button" className="btn-approve" onClick={() => approveApplication(app._id, `${app.firstName} ${app.lastName}`)}>
                    ✅ Approve
                  </button>
                  <button type="button" className="btn-deny" onClick={() => denyApplication(app._id)}>
                    ❌ Deny
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
