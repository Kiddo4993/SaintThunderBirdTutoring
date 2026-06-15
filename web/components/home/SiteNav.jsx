"use client";

import { useEffect, useState } from "react";
import BrandIcon from "@/components/BrandIcon";
import ThunderbirdLogo from "@/components/ThunderbirdLogo";

const THEME_KEY = "st-theme";

export default function SiteNav({ onInfoClick }) {
  const [isLight, setIsLight] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

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

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <nav id="nav">
        <div className="nav-container">
          <div className="logo">
            <ThunderbirdLogo size={28} color="#d4a574" className="logo-icon" />
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
                  <BrandIcon name="sun" size={18} />
                ) : (
                  <BrandIcon name="moon" size={18} />
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
                <BrandIcon name="menu" size={18} />
              </button>
            </li>
            <li>
              <a href="/login" className="profile-icon" aria-label="Login or sign up">
                <BrandIcon name="user" size={18} />
              </a>
            </li>
          </ul>

          {/* Mobile controls */}
          <div className="mobile-nav-controls">
            <button
              type="button"
              className="theme-toggle"
              aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
              onClick={toggleTheme}
            >
              {isLight ? (
                <BrandIcon name="sun" size={18} />
              ) : (
                <BrandIcon name="moon" size={18} />
              )}
            </button>
            <button
              type="button"
              className="hamburger-btn"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className={`hamburger-icon ${menuOpen ? "open" : ""}`}>
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
        <div className="nav-progress" aria-hidden="true">
          <div className="nav-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMenu} aria-hidden="true" />
      )}
      <div className={`mobile-menu-drawer ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu-header">
          <div className="logo">
            <ThunderbirdLogo size={24} color="#d4a574" />
            <span>Saint Thunderbird</span>
          </div>
          <button type="button" className="mobile-menu-close" onClick={closeMenu} aria-label="Close menu">
            ✕
          </button>
        </div>
        <nav className="mobile-menu-nav">
          <a href="/about" className="mobile-nav-link" onClick={closeMenu}>About</a>
          <a href="/subjects" className="mobile-nav-link" onClick={closeMenu}>Subjects</a>
          <a href="/students" className="mobile-nav-link" onClick={closeMenu}>Students</a>
          <a href="/mentors" className="mobile-nav-link" onClick={closeMenu}>Mentors</a>
          <a href="/login" className="mobile-nav-link" onClick={closeMenu}>Login / Sign Up</a>
          <button
            type="button"
            className="mobile-nav-link mobile-info-btn"
            onClick={() => { closeMenu(); onInfoClick?.(); }}
          >
            Organization Info
          </button>
        </nav>
      </div>
    </>
  );
}
