"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TutorPendingPage() {
  const router = useRouter();

  useEffect(() => {
    const user = (() => {
      try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
    })();
    const token = localStorage.getItem("authToken");

    if (!user || !token) {
      router.push("/login");
      return;
    }

    const emailEl = document.getElementById("emailDisplay");
    if (emailEl) emailEl.textContent = `Check ${user.email} for updates`;

    async function checkStatus(showAlerts = false) {
      try {
        const res = await fetch("/api/tutor/application-status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) return;

        const status = data.status || "not_applied";
        const isApproved = data.userType === "tutor" && status === "approved";

        if (isApproved) {
          if (showAlerts) alert("🎉 Congratulations! Your tutor application has been approved!");
          const updated = { ...user, userType: "tutor", tutorApplication: { ...(user.tutorApplication || {}), status: "approved" } };
          localStorage.setItem("user", JSON.stringify(updated));
          router.push("/tutor-dashboard");
          return;
        }

        if (status === "denied") {
          if (showAlerts) alert("❌ Your tutor application was not approved. You can continue as a student.");
          const updated = { ...user, tutorApplication: { ...(user.tutorApplication || {}), status: "denied" } };
          localStorage.setItem("user", JSON.stringify(updated));
          router.push("/student-dashboard");
          return;
        }

        if (status !== "pending") {
          router.push("/student-dashboard");
        }
      } catch {
        // Retry on next interval
      }
    }

    checkStatus(false);
    const interval = setInterval(() => checkStatus(true), 10000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <>
      <div className="mesh-gradient"></div>
      <div className="pending-container">
        <div className="pending-logo">⚡</div>
        <h1>Application Submitted</h1>
        <p className="pending-status">Your tutor application is under review</p>
        <div className="pending-badge">⏳ PENDING APPROVAL</div>
        <div className="pending-spinner"></div>
        <div className="pending-email-sent">
          <strong>✉️ Confirmation email sent</strong>
          <p id="emailDisplay">Check your email for updates</p>
        </div>
        <div className="pending-info-box">
          <h3>📋 What happens next?</h3>
          <p>✓ Our team will review your application</p>
          <p>✓ We&apos;ll verify your information</p>
          <p>✓ You&apos;ll receive an email with our decision</p>
          <p>✓ Approved tutors can start teaching immediately</p>
        </div>
        <div className="pending-info-box">
          <h3>⏱️ Typical Review Time</h3>
          <p>Most applications are reviewed within 24-48 hours</p>
          <p>You&apos;ll be notified by email as soon as we make a decision</p>
        </div>
        <button type="button" onClick={() => (window.location.href = "/")}>← Back to Home</button>
      </div>
    </>
  );
}
