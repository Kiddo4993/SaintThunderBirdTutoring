"use client";

import { useEffect } from "react";

export default function MarketingEffects() {
  // Nav scroll effect
  useEffect(() => {
    const nav = document.getElementById("nav");
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 100) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll to top button
  useEffect(() => {
    const scrollBtn = document.getElementById("scrollTopBtn");
    if (!scrollBtn) return;
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

  // Scroll reveal animations
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
      ".purpose-highlight",
      ".stats-mini",
      ".founder-card",
    ];

    revealSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (!el.classList.contains("visible")) revealObserver.observe(el);
      });
    });

    return () => revealObserver.disconnect();
  }, []);

  // Counter animations
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
            el.textContent = Math.round(target * eased).toLocaleString();
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

  // Progress bar fill animations
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

  // Smooth scroll for anchor links
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

  return null;
}
