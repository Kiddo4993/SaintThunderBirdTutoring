"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { infoCards } from "@/lib/site-data";

export default function InfoMenuLayer({ infoMenuOpen, setInfoMenuOpen }) {
  const [mounted, setMounted] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const premiumTimerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (premiumTimerRef.current) clearTimeout(premiumTimerRef.current);
    };
  }, []);

  const hidePremium = useCallback(() => {
    if (premiumTimerRef.current) clearTimeout(premiumTimerRef.current);
    setPremiumOpen(false);
  }, []);

  const showPremiumCard = useCallback(
    (index) => {
      setCardIndex(index);
      setPremiumOpen(true);
      setInfoMenuOpen(false);
      if (premiumTimerRef.current) clearTimeout(premiumTimerRef.current);
      premiumTimerRef.current = setTimeout(() => {
        hidePremium();
      }, 12000);
    },
    [hidePremium, setInfoMenuOpen],
  );

  useEffect(() => {
    function onDocClick(e) {
      if (!infoMenuOpen) return;
      if (!e.target.closest(".info-menu-btn") && !e.target.closest(".info-menu-dropdown")) {
        setInfoMenuOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [infoMenuOpen, setInfoMenuOpen]);

  if (!mounted) return null;

  const card = infoCards[cardIndex];

  const premiumLayer =
    premiumOpen &&
    createPortal(
      <div className="premium-info-card active">
        <div className="premium-info-backdrop" onClick={hidePremium} aria-hidden />
        <div className="premium-info-content">
          <button type="button" className="premium-info-close" onClick={hidePremium}>
            ×
          </button>
          <div className="premium-info-icon">{card.icon}</div>
          <div className="premium-info-header">
            <h3 className="premium-info-title">{card.title}</h3>
            <p className="premium-info-subtitle">{card.subtitle}</p>
          </div>
          <p className="premium-info-description">{card.description}</p>
          <div className="premium-info-highlight">✨ {card.highlight} ✨</div>
          <div className="premium-info-stats">
            {card.stats.map((stat) => (
              <span key={stat} className="stat-badge">
                {stat}
              </span>
            ))}
          </div>
          <div className="premium-info-footer">
            <button
              type="button"
              className="premium-info-prev"
              onClick={() => setCardIndex((i) => (i - 1 + infoCards.length) % infoCards.length)}
            >
              ←
            </button>
            <span className="premium-info-counter">
              {cardIndex + 1}/{infoCards.length}
            </span>
            <button
              type="button"
              className="premium-info-next"
              onClick={() => setCardIndex((i) => (i + 1) % infoCards.length)}
            >
              →
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );

  const menuLayer = createPortal(
    <div className={`info-menu-dropdown ${infoMenuOpen ? "active" : ""}`}>
      <div className="info-menu-content">
        {infoCards.map((c, index) => (
          <button
            type="button"
            key={c.title}
            className="info-menu-item w-full border-0 bg-transparent text-left"
            onClick={() => showPremiumCard(index)}
          >
            <span className="menu-item-icon">{c.icon}</span>
            <div className="menu-item-text">
              <div className="menu-item-title">{c.title}</div>
              <div className="menu-item-subtitle">{c.subtitle}</div>
            </div>
            <span className="menu-item-arrow">→</span>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );

  return (
    <>
      {premiumLayer}
      {menuLayer}
    </>
  );
}
