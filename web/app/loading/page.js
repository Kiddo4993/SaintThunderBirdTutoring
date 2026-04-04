"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoadingPage() {
  const router = useRouter();

  useEffect(() => {
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
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="loading-page">
      <div className="loading-stars" id="loadingStars"></div>
      <div className="loading-content">
        <div className="loading-logo">⚡</div>
        <h1 className="loading-title">Saint Thunderbird</h1>
        <p className="loading-subtitle">Loading your experience...</p>
        <div className="loading-bar">
          <div className="loading-bar-fill"></div>
        </div>
      </div>
    </div>
  );
}
