"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LoadingPage() {
  const router = useRouter();
  const emberRef = useRef(null);

  useEffect(() => {
    if (emberRef.current) {
      for (let i = 0; i < 45; i++) {
        const ember = document.createElement("div");
        ember.className = "ember";
        ember.style.left = Math.random() * 100 + "%";
        ember.style.bottom = Math.random() * 40 + "%";
        ember.style.animationDelay = Math.random() * 5 + "s";
        ember.style.animationDuration = (Math.random() * 3 + 2.5) + "s";
        const s = (Math.random() * 3 + 1) + "px";
        ember.style.width = s;
        ember.style.height = s;
        ember.style.setProperty("--drift", (Math.random() * 80 - 40) + "px");
        emberRef.current.appendChild(ember);
      }
    }

    const token = localStorage.getItem("authToken");
    const user = (() => {
      try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
    })();

    const timer = setTimeout(() => {
      if (!token || !user) {
        router.push("/");
        return;
      }
      if (user.email === "dylanduancanada@gmail.com" || user.userType === "tutor") {
        router.push("/tutor-dashboard");
      } else if (user.tutorApplication?.status === "pending") {
        router.push("/tutor-pending");
      } else {
        router.push("/student-dashboard");
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="loading-container">
      <div className="ember-field" ref={emberRef} aria-hidden="true" />
      <div className="aurora-ribbons" aria-hidden="true">
        <div className="aurora-ribbon ribbon-1" />
        <div className="aurora-ribbon ribbon-2" />
        <div className="aurora-ribbon ribbon-3" />
        <div className="aurora-ribbon ribbon-4" />
      </div>
      <div className="loading-content">
        <div className="hologram-container">
          <div className="thunderbird-hologram">
            <img
              src="/logo.svg"
              width="160"
              height="77"
              alt=""
              aria-hidden="true"
              style={{ filter: "drop-shadow(0 0 40px rgba(212,165,116,0.65))" }}
            />
          </div>
        </div>
        <h1 className="intro-title">Saint Thunderbird</h1>
        <p className="intro-subtitle">Tutoring</p>
        <div className="progress-section">
          <p className="progress-label">Loading your experience...</p>
          <div className="progress-bar-wrapper">
            <div className="progress-bar-fill" />
          </div>
        </div>
        <div className="loading-dots">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
      </div>
    </div>
  );
}
