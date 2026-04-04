"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "st-theme";

export default function SiteNav({ onInfoClick }) {
  const [themeBtn, setThemeBtn] = useState("🌓");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light") {
        document.body.classList.add("light-mode");
        setThemeBtn("☀️");
      }
    } catch {
      /* ignore */
    }
  }, []);

  function toggleTheme() {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    try {
      localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
    } catch {
      /* ignore */
    }
    setThemeBtn(isLight ? "☀️" : "🌓");
  }

  return (
    <nav id="nav">
      <div className="nav-container">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <span>Saint Thunderbird</span>
        </div>
        <ul className="nav-links">
          <li>
            <a href="/about" className="nav-link">
              About
            </a>
          </li>
          <li>
            <a href="/subjects" className="nav-link">
              Subjects
            </a>
          </li>
          <li>
            <a href="/students" className="nav-link">
              Students
            </a>
          </li>
          <li>
            <a href="/mentors" className="nav-link">
              Mentors
            </a>
          </li>
          <li>
            <button
              type="button"
              className="theme-toggle"
              title="Toggle Theme"
              onClick={toggleTheme}
            >
              {themeBtn}
            </button>
          </li>
          <li>
            <button
              type="button"
              className="info-menu-btn"
              title="Organization Info"
              onClick={onInfoClick}
            >
              ☰
            </button>
          </li>
          <li>
            <a href="/login" className="profile-icon" title="Login / Sign Up">
              👤
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
