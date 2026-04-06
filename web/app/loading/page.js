"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LoadingPage() {
  const router = useRouter();
  const starsRef = useRef(null);

  useEffect(() => {
    // Generate stars
    if (starsRef.current) {
      for (let i = 0; i < 150; i++) {
        const star = document.createElement("div");
        star.className = "star";
        star.style.left = Math.random() * 100 + "%";
        star.style.top = Math.random() * 100 + "%";
        star.style.animationDelay = Math.random() * 3 + "s";
        star.style.width = star.style.height = (Math.random() * 2 + 1) + "px";
        starsRef.current.appendChild(star);
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
      <div className="stars-field" ref={starsRef}></div>
      <div className="grid-lines">
        {[...Array(8)].map((_, i) => (
          <div key={`h${i}`} className="grid-line-h" style={{ top: `${i * 14.28}%` }} />
        ))}
        {[...Array(8)].map((_, i) => (
          <div key={`v${i}`} className="grid-line-v" style={{ left: `${i * 14.28}%` }} />
        ))}
      </div>
      <div className="glow-orb orb-primary"></div>
      <div className="glow-orb orb-secondary"></div>
      <div className="glow-orb orb-accent"></div>
      <div className="energy-ring"></div>
      <div className="scan-line"></div>
      <div className="loading-content">
        <div className="hologram-container">
          <div className="thunderbird-hologram">⚡</div>
        </div>
        <h1 className="intro-title">Saint Thunderbird</h1>
        <p className="intro-subtitle">Tutoring</p>
        <div className="progress-section">
          <p className="progress-label">Loading your experience...</p>
          <div className="progress-bar-wrapper">
            <div className="progress-bar-fill"></div>
          </div>
        </div>
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
}
