"use client";

import { useEffect, useState } from "react";
import { Zap, Moon, Sun, Menu, User } from "lucide-react";

const THEME_KEY = "st-theme";

export default function SiteNav({ onInfoClick }) {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light") {
        document.body.classList.add("light-mode");
        setIsLight(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function toggleTheme() {
    document.body.classList.toggle("light-mode");
    const light = document.body.classList.contains("light-mode");
    try {
      localStorage.setItem(THEME_KEY, light ? "light" : "dark");
    } catch {
      /* ignore */
    }
    setIsLight(light);
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <nav id="nav">
        <div className="nav-container">
          <div className="logo">
            <Zap className="logo-icon" size={22} aria-hidden="true" />
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
                aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
                onClick={toggleTheme}
              >
                {isLight ? (
                  <Sun size={18} aria-hidden="true" />
                ) : (
                  <Moon size={18} aria-hidden="true" />
                )}
              </button>
            </li>
            <li>
              <button
                type="button"
                className="info-menu-btn"
                aria-label="Organization info menu"
                onClick={onInfoClick}
              >
                <Menu size={18} aria-hidden="true" />
              </button>
            </li>
            <li>
              <a href="/login" className="profile-icon" aria-label="Login or sign up">
                <User size={18} aria-hidden="true" />
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
