"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { infoCards, popups } from "@/lib/site-data";

function rnd(min, max) {
  return Math.random() * (max - min) + min;
}

export default function HomeEffects({ infoMenuOpen, setInfoMenuOpen }) {
  const [mounted, setMounted] = useState(false);
  const [popupIndex, setPopupIndex] = useState(0);
  const [popupVisible, setPopupVisible] = useState(false);
  const popupVisibleRef = useRef(false);

  const [premiumOpen, setPremiumOpen] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const premiumTimerRef = useRef(null);

  const audioContextRef = useRef(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
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
    return () => {
      if (premiumTimerRef.current) clearTimeout(premiumTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const observerOptions = { threshold: 0.18, rootMargin: "0px 0px -50px 0px" };
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("visible");
          }, index * 80);
          revealObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const revealSelectors = [
      ".section-header",
      ".glass-card",
      ".stat",
      ".hero-badge",
      ".cta-group",
      ".hero h1",
      ".hero p",
    ];

    revealSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (!el.classList.contains("visible")) revealObserver.observe(el);
      });
    });

    return () => revealObserver.disconnect();
  }, []);

  useEffect(() => {
    const counters = document.querySelectorAll(".counter");
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          if (el.dataset._animated) {
            counterObserver.unobserve(el);
            return;
          }
          const target = parseInt(el.getAttribute("data-target") || "0", 10);
          const duration = 2000;
          let frame = 0;
          const fps = 60;
          const totalFrames = (duration / 1000) * fps;

          const animate = () => {
            frame++;
            const progress = frame / totalFrames;
            const eased = 1 - (1 - progress) ** 3;
            const value = Math.round(target * eased);
            el.textContent = value.toLocaleString();
            if (frame < totalFrames) {
              requestAnimationFrame(animate);
            } else {
              el.textContent = target.toLocaleString();
              el.dataset._animated = "true";
              counterObserver.unobserve(el);
            }
          };
          requestAnimationFrame(animate);
        });
      },
      { threshold: 0.3 },
    );

    counters.forEach((c) => counterObserver.observe(c));
    return () => counterObserver.disconnect();
  }, []);

  useEffect(() => {
    const progressFills = document.querySelectorAll(".progress-fill");
    const progressObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const fill = entry.target;
          if (fill.dataset._filled) {
            progressObserver.unobserve(fill);
            return;
          }
          const width = parseFloat(fill.getAttribute("data-width") || "100");
          setTimeout(() => {
            fill.style.width = `${width}%`;
            fill.style.background = "linear-gradient(90deg, #ff8c00, #ffa500, #ff6b35)";
            fill.dataset._filled = "true";
          }, 100);
          progressObserver.unobserve(fill);
        });
      },
      { threshold: 0.2 },
    );

    progressFills.forEach((f) => progressObserver.observe(f));
    return () => progressObserver.disconnect();
  }, []);

  useEffect(() => {
    const nav = document.getElementById("nav");
    if (!nav) return undefined;
    const onScroll = () => {
      if (window.scrollY > 100) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const anchors = document.querySelectorAll('a[href^="#"]');
    const handlers = [];
    anchors.forEach((anchor) => {
      const fn = (e) => {
        const href = anchor.getAttribute("href");
        if (!href || href === "#") return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      anchor.addEventListener("click", fn);
      handlers.push({ anchor, fn });
    });
    return () => {
      handlers.forEach(({ anchor, fn }) => anchor.removeEventListener("click", fn));
    };
  }, []);

  useEffect(() => {
    const starsRoot = document.getElementById("stars");
    if (!starsRoot || starsRoot.dataset.generated) return;
    for (let i = 0; i < 100; i++) {
      const star = document.createElement("div");
      star.className = "star";
      star.style.cssText = `
        left: ${rnd(0, 100)}%;
        top: ${rnd(0, 100)}%;
        width: ${rnd(1, 3)}px;
        height: ${rnd(1, 3)}px;
        animation-delay: ${rnd(0, 3)}s;
      `;
      starsRoot.appendChild(star);
    }
    starsRoot.dataset.generated = "true";
  }, []);

  useEffect(() => {
    const scrollBtn = document.getElementById("scrollTopBtn");
    if (!scrollBtn) return undefined;
    const onScroll = () => {
      if (window.scrollY > 300) scrollBtn.classList.add("visible");
      else scrollBtn.classList.remove("visible");
    };
    const onClick = (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    scrollBtn.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      scrollBtn.removeEventListener("click", onClick);
    };
  }, []);

  const tryShowPopup = useCallback(() => {
    if (popupVisibleRef.current) return;
    popupVisibleRef.current = true;
    setPopupVisible(true);
    setTimeout(() => {
      popupVisibleRef.current = false;
      setPopupVisible(false);
      setPopupIndex((i) => (i + 1) % popups.length);
    }, 8000);
  }, []);

  function hidePopupManual() {
    popupVisibleRef.current = false;
    setPopupVisible(false);
  }

  useEffect(() => {
    const t1 = setTimeout(tryShowPopup, 6000);
    const interval = setInterval(tryShowPopup, 25000);
    return () => {
      clearTimeout(t1);
      clearInterval(interval);
    };
  }, [tryShowPopup]);

  useEffect(() => {
    const volumeSlider = document.getElementById("volumeSlider");
    const musicToggle = document.getElementById("musicToggle");
    const volumeValue = document.getElementById("volumeValue");
    const collapseBtn = document.getElementById("collapseBtn");
    const musicControl = document.getElementById("musicControl");

    function onVolumeInput() {
      if (volumeValue && volumeSlider) volumeValue.textContent = `${volumeSlider.value}%`;
    }

    function playNote(frequency, duration) {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      const volumeSliderEl = document.getElementById("volumeSlider");
      const volume = volumeSliderEl ? volumeSliderEl.value / 100 : 0.3;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.05 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001 * volume, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    }

    function playClassicalMusic() {
      if (!isPlayingRef.current) return;
      const notes = [
        { freq: 329.63, duration: 0.6 },
        { freq: 349.23, duration: 0.6 },
        { freq: 392.0, duration: 0.9 },
        { freq: 349.23, duration: 0.6 },
        { freq: 329.63, duration: 0.6 },
        { freq: 293.66, duration: 0.9 },
        { freq: 261.63, duration: 0.6 },
        { freq: 293.66, duration: 0.6 },
        { freq: 329.63, duration: 0.9 },
      ];
      let delay = 0;
      notes.forEach((note) => {
        setTimeout(() => {
          if (isPlayingRef.current) playNote(note.freq, note.duration);
        }, delay * 1000);
        delay += note.duration;
      });
      if (isPlayingRef.current) {
        setTimeout(() => playClassicalMusic(), delay * 1000);
      }
    }

    function toggleMusic() {
      const btn = document.getElementById("musicToggle");
      if (!isPlayingRef.current) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        audioContextRef.current.resume();
        isPlayingRef.current = true;
        if (btn) btn.textContent = "⏸ Stop Music";
        playClassicalMusic();
      } else {
        isPlayingRef.current = false;
        if (btn) btn.textContent = "▶ Play Music";
      }
    }

    if (volumeSlider) {
      volumeSlider.addEventListener("input", onVolumeInput);
    }
    if (musicToggle) {
      musicToggle.addEventListener("click", toggleMusic);
    }
    if (collapseBtn && musicControl) {
      collapseBtn.addEventListener("click", () => {
        const isCollapsed = musicControl.classList.toggle("collapsed");
        collapseBtn.textContent = isCollapsed ? "←" : "→";
      });
    }

    return () => {
      if (volumeSlider) volumeSlider.removeEventListener("input", onVolumeInput);
      if (musicToggle) musicToggle.removeEventListener("click", toggleMusic);
    };
  }, []);

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

  const p = popups[popupIndex];
  const card = infoCards[cardIndex];

  const popupLayer =
    mounted &&
    createPortal(
      <div className={`st-popup ${popupVisible ? "active" : ""}`}>
        <div className="st-popup-card">
          <button type="button" className="st-popup-close" aria-label="Close" onClick={hidePopupManual}>
            ×
          </button>
          <div className="st-popup-icon">{p.icon}</div>
          <h3 className="st-popup-title">{p.title}</h3>
          <p className="st-popup-msg">{p.msg}</p>
          <a href={p.link} className="st-popup-btn">
            {p.btn}
          </a>
        </div>
      </div>,
      document.body,
    );

  const premiumLayer =
    mounted &&
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

  const menuLayer =
    mounted &&
    createPortal(
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
      {popupLayer}
      {premiumLayer}
      {menuLayer}
    </>
  );
}
