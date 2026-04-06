"use client";

import { useEffect, useRef, useState } from "react";
import HomeEffects from "./HomeEffects";
import SiteNav from "./SiteNav";

export default function HomeClient({ children }) {
  const [infoMenuOpen, setInfoMenuOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [introExiting, setIntroExiting] = useState(false);
  const starsRef = useRef(null);

  useEffect(() => {
    // Only show the intro animation once per session
    const seen = sessionStorage.getItem("st-intro-seen");
    if (!seen) {
      setShowIntro(true);
      sessionStorage.setItem("st-intro-seen", "1");

      // Start exit animation at 4s, fully remove at 5s
      const exitTimer = setTimeout(() => setIntroExiting(true), 4000);
      const removeTimer = setTimeout(() => setShowIntro(false), 5000);
      return () => {
        clearTimeout(exitTimer);
        clearTimeout(removeTimer);
      };
    }
  }, []);

  useEffect(() => {
    if (!showIntro || !starsRef.current) return;
    for (let i = 0; i < 150; i++) {
      const star = document.createElement("div");
      star.className = "star";
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 100 + "%";
      star.style.animationDelay = Math.random() * 3 + "s";
      const size = Math.random() * 2 + 1 + "px";
      star.style.width = size;
      star.style.height = size;
      starsRef.current.appendChild(star);
    }
  }, [showIntro]);

  return (
    <>
      {showIntro && (
        <div className={`loading-container${introExiting ? " exit" : ""}`}>
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
      )}
      <SiteNav onInfoClick={() => setInfoMenuOpen((v) => !v)} />
      {children}
      <HomeEffects infoMenuOpen={infoMenuOpen} setInfoMenuOpen={setInfoMenuOpen} />
    </>
  );
}
