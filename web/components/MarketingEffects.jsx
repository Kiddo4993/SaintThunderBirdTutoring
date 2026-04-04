"use client";

import { useEffect } from "react";

export default function MarketingEffects() {
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

  return null;
}
